from django.shortcuts import render, redirect
from django.views import generic
from .forms import GameSettingForm


class Index(generic.TemplateView):
    template_name = 'game/index.html'


def home(request):
    if request.method == 'GET':
        form = GameSettingForm(request.session.get('form_data'))
    else:
        form = GameSettingForm(request.POST)
        if form.is_valid():
            request.session['form_data'] = request.POST
            return redirect('home/play')

    context = {'form': form}
    return render(request, 'game/home.html', context)
