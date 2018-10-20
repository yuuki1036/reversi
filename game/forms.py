from django import forms


class GameSettingForm(forms.Form):

    MODE_CHOICES = (
        ('computer', '１人プレイ'),
        ('person', '２人プレイ'),
    )

    COLOR_CHOICES = (
        ('black', 'くろ'),
        ('white', 'しろ'),
    )

    TURN_CHOICES = (
        ('you', '自分'),
        ('opp', '相手'),
    )

    ALL_CHOICES =[
        {'computer': '１人プレイ', 'person': '２人プレイ'},
        {'black': ' くろ', 'white': 'しろ'},
        {'i': '自分', 'y': '相手'},
    ]

    mode = forms.ChoiceField(
        label='対戦モード',
        choices=MODE_CHOICES,
        initial='computer',
        required=False,
    )

    color = forms.ChoiceField(
        label='自分のいろ',
        choices=COLOR_CHOICES,
        initial='black',
        required=False,
    )

    turn = forms.ChoiceField(
        label='先手',
        choices=TURN_CHOICES,
        initial='you',
        required=False,
    )

    hint = forms.BooleanField(
        label='ヒントモード',
        initial=False,
        required=False,
    )

    class Meta:
        fields = ['mode', 'color', 'turn', 'hint']
