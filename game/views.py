from django.shortcuts import render, redirect
from django.views import generic


class Index(generic.TemplateView):
    template_name = 'game/index.html'



