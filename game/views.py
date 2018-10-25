from django.shortcuts import render, redirect
from django.views import generic
from django.contrib.auth.mixins import LoginRequiredMixin
from .forms import GameSettingForm
from .models import GameResult
from django.http import JsonResponse
import json
import random


class Index(generic.TemplateView):
    template_name = 'game/index.html'


def home(request): # ホーム画面
    if request.method == 'GET':
        # 設定データが残っていれば再現する
        form = GameSettingForm(request.session.get('form_data'))
    else:
        form = GameSettingForm(request.POST)
        if form.is_valid():
            # セッションに設定データ格納
            request.session['form_data'] = request.POST
            return redirect('game:play')

    context = {'form': form}
    return render(request, 'game/home.html', context)


class ResultList(generic.ListView, LoginRequiredMixin):
    login_url = '/login/'
    redirect_field_name = 'redirect_to'
    model = GameResult
    template_name = 'game/result_list.html'
    context_object_name = 'result' # テンプレート上の名前

    def get_queryset(self): # 新しい順
        return GameResult.objects.order_by('pk').reverse()[:11]


class Ranking(generic.ListView):
    template_name = 'game/ranking.html'
    context_object_name = 'result'

    def get_queryset(self): # 勝っているものの中からスコア高い順
        return GameResult.objects.filter(
            win_or_lose='win').order_by('score').reverse()[:10]


def play(request): # ゲーム画面
    session = GameSettingForm(request.session.get('form_data'))
    context = {'set': session}

    if context is None: # 設定データが無ければリダイレクト
        return redirect('game:home')

    return render(request, 'game/play.html', context)


def result(request): # ゲーム修了時のajax受信先
    d = json.load(request)

    if d['winner'] == 'drow':
        win_or_lose = 'drow'
    else:
        if d['winner'] == d['you_color']:
            win_or_lose = 'win'
        else:
            win_or_lose = 'lose'

    d['win_or_lose'] = win_or_lose

    # ユーザープロファイル更新・履歴の作成
    if request.user.is_authenticated and d['mode'] == 'computer':
        status = request.user.userprofile
        status.play_count += 1

        if win_or_lose == 'win':
            d['score'] += 10000
            status.wins += 1
        elif win_or_lose == 'lose':
            status.loses += 1

        status.winning_per = int(status.wins) / int(status.play_count) * 100

        if status.hi_score < d['score']:
            status.hi_score = d['score']

        status.save()

        p = GameResult(
            user=request.user,
            name=request.user.username,
            win_or_lose=d['win_or_lose'],
            stone=str(d['cnt_b']) + " - " + str(d['cnt_w']),
            score=d['score'],
        )
        p.save()

    return JsonResponse(d)


# culc用変数
drct = [(-1,-1), (-1,0), (-1,1), (0,1), (1,1), (1,0), (1,-1), (0,-1)]


def culc(request): # ajax受信先
    '''
    盤面よりゲームの状況を決定する
    石設置可能番地とひっくり返る石の番地を計算する
    VS COM時はCOMの選択を決定する
    '''
    d = json.load(request)

    def change_str(y, x):
        return str(y) + str(x)

    def search_drct(board, color, y, x):
        result = []
        if color == 'black':
            color = 'B'
            rev_color = 'W'
        else:
            color = 'W'
            rev_color = 'B'

        for d in drct: # drctは方角別のインデックス増減リスト
            dy = y + d[0]
            dx = x + d[1]
            # 周りに反対色の石があるか確認
            if 0 <= dy <= 7 and 0 <= dx <= 7 and board[dy][dx] == rev_color:
                # 仮のリスト。先頭は置く番地、以後はひっくり返る番地
                pre_result = [change_str(y, x), change_str(dy, dx)]
                # 自分の石に当たるまでその方向に進む
                while True:
                    dy += d[0]
                    dx += d[1]
                    if 0 <= dy <= 7 and 0 <= dx <= 7 and board[dy][dx] != '*':
                        if board[dy][dx] == color:
                            # 一つ以上ひっくり返せる事が確定したので仮のリストを追加する
                            result.extend(pre_result)
                            break
                        elif board[dy][dx] == rev_color:
                            # 反対色ならば仮のリストに追加
                            pre_result.append(change_str(dy, dx))
                    else:
                        # 仮のリストは追加せず次の方角へ進む
                        break
        return result

    def search_puttable(board, color):
        result_puttable = []
        for i in range(8):
            for j in range(8):
                if board[i][j] == '*':
                    # 空の番地から各方向に向けて探索する
                    result = search_drct(board, color, i, j)
                    if result:
                        result_puttable.append(result)
        return result_puttable

    # puttableリストを作成する
    d['puttable'] = search_puttable(d['board'], d['color'])

    # 盤面状況からゲームの終了を判断する
    def check_board():
        cnt_b = 0
        cnt_w = 0

        for i in d['board']:
            for j in i:
                if j == 'W':
                    cnt_w += 1
                elif j == 'B':
                    cnt_b += 1

        if cnt_b == 0 or cnt_w == 0 or cnt_b + cnt_w == 64 or (d['status'] == 'pass_reach' and not d['puttable']):
            d['status'] = 'end'
        else:
            d['status'] = 'continue'

        return cnt_b, cnt_w

    cnt_b, cnt_w = check_board()

    # COMの選択を決定する
    def com_culc(level):
        if level == '1': # LEVEL1はランダム
            return random.choice(d['puttable'])[0]
        else: # LEVEL2,LEVEL3はひっくり返せる数が最も多い位置を選択する
            s_list = sorted(d['puttable'],key=lambda x: len(x), reverse=True)
            if level == '2':
                return s_list[0][0]
            else: # LEVEL3は角の番地を優先して選択する
                top_priority = ['00', '07', '70', '77']
                idx = 0
                for i, arr in enumerate(s_list):
                    if arr[0] in top_priority:
                        idx = i
                        break
                return s_list[idx][0]

    # ゲーム終了時に結果を作成する
    if d['status'] == 'end':
        if cnt_b > cnt_w:
            winner = 'black'
        elif cnt_b < cnt_w:
            winner = 'white'
        else:
            winner = "drow"

        d['cnt_b'] = cnt_b
        d['cnt_w'] = cnt_w
        d['winner'] = winner
        return JsonResponse(d)

    # puttableリストが空ならばパスする
    if not d['puttable']:
        d['status'] = 'pass'
        return JsonResponse(d)

    # COMの選択を決定する
    if d['mode'] == 'computer' and d['turn'] == 'opp':
        d['select'] = com_culc(d['strength'])

    # 一回目の受信完了。ステータスを変更する
    if d['status'] == 'initialize':
        d['status'] = 'continue'
        return JsonResponse(d)

    return JsonResponse(d)
