from django.shortcuts import render, redirect
from django.views import generic
from django.contrib.auth.mixins import LoginRequiredMixin
from .forms import GameSettingForm
from .models import GameResult
from django.http import JsonResponse
import json



class Index(generic.TemplateView):
    template_name = 'game/index.html'


def home(request):
    if request.method == 'GET':
        form = GameSettingForm(request.session.get('form_data'))
    else:
        form = GameSettingForm(request.POST)
        if form.is_valid():
            request.session['form_data'] = request.POST
            return redirect('game:play')

    context = {'form': form}
    return render(request, 'game/home.html', context)


class ResultList(generic.ListView, LoginRequiredMixin):
    login_url = '/login/'
    redirect_field_name = 'redirect_to'
    model = GameResult
    template_name = 'game/result_list.html'
    context_object_name = 'result'


class Ranking(generic.ListView):
    template_name = 'game/ranking.html'
    context_object_name = 'result'

    def get_queryset(self):
        return GameResult.objects.filter(
            win_or_lose='win').order_by('score').reverse()[:10]


def play(request):
    session = GameSettingForm(request.session.get('form_data'))
    context = {'set': session}

    if context is None:
        return redirect('game:home')
    return render(request, 'game/play.html', context)


def result(request):
    d = json.load(request)

    if d['winner'] == 'drow':
        win_or_lose = 'drow'
    else:
        if d['winner'] == d['you_color']:
            win_or_lose = 'win'
        else:
            win_or_lose = 'lose'

        d['win_or_lose'] = win_or_lose

    if request.user.is_authenticated and d['mode'] == 'computer':
        status = request.user.userprofile
        status.play_count += 1
        if win_or_lose == 'win':
            d['score'] += 10000
            status.wins += 1
        elif win_or_lose == 'lose':
            status.loses += 1

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





drct = [(-1,-1), (-1,0), (-1,1), (0,1), (1,1), (1,0), (1,-1), (0,-1)]


def culc(request):
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

        for d in drct:
            dy = y + d[0]
            dx = x + d[1]
            if 0 <= dy <= 7 and 0 <= dx <= 7 and board[dy][dx] == rev_color:
                pre_result = [change_str(y, x), change_str(dy, dx)]
                while True:
                    dy += d[0]
                    dx += d[1]
                    if 0 <= dy <= 7 and 0 <= dx <= 7 and board[dy][dx] != '*':
                        if board[dy][dx] == color:
                            result.extend(pre_result)
                            break
                        elif board[dy][dx] == rev_color:
                            pre_result.append(change_str(dy, dx))
                    else:
                        break
        return result

    def search_puttable(board, color):
        result_puttable = []
        for i in range(8):
            for j in range(8):
                if board[i][j] == '*':
                    result = search_drct(board, color, i, j)
                    if result:
                        result_puttable.append(result)
        return result_puttable

    puttable = search_puttable(d['board'], d['color'])
    d['puttable'] = puttable

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

    if not d['puttable']:
        d['status'] = 'pass'
        return JsonResponse(d)

    if d['mode'] == 'computer' and d['turn'] == 'opp':
        max_length = 0
        max_idx = 0
        for i, arr in enumerate(d['puttable']):
            if len(arr) > max_length:
                max_length = len(arr)
                max_idx = i
        d['select'] = d['puttable'][max_idx][0]

    if d['status'] == 'initialize':
        d['status'] = 'continue'
        return JsonResponse(d)

    return JsonResponse(d)
