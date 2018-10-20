from django.shortcuts import render, redirect
from django.views import generic
from .forms import GameSettingForm
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


def play(request):
    session = GameSettingForm(request.session.get('form_data'))
    context = {'set': session}

    if context is None:
        return redirect('game:home')
    return render(request, 'game/play.html', context)


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
            dy, dx = y, x
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

    if not d['puttable']:
        d['status'] = 'pass'

    if d['mode'] == 'computer' and d['turn'] == 'opp':
        max_length = 0
        for i, arr in enumerate(['puttable']):
            if len(arr) > max_length:
                max_length = i
        d['select'] = d['puttable'][max_length][0]
    if d['status'] == 'initialize':
        d['status'] = 'continue'
        print(d)
        return JsonResponse(d)


    print(d)
    return JsonResponse(d)