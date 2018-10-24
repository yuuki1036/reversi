from django import forms


class GameSettingForm(forms.Form):
    MODE_CHOICES = (
        ('computer', '１人プレイ'),
        ('person', '２人プレイ'),
    )
    STRENGTH_CHOICES = (
        ('1', 'よわ太郎'),
        ('2', 'ふつう市民'),
        ('3', 'つよ男爵'),
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
        {'1': 'よわ太郎', '2': 'ふつう市民', '3': 'つよ男爵'},
        {'black': ' くろ', 'white': 'しろ'},
        {'i': '自分', 'y': '相手'},
    ]

    mode = forms.ChoiceField(
        label='対戦モード',
        choices=MODE_CHOICES,
        initial='computer',
        required=False,
    )
    strength = forms.ChoiceField(
        label="COMの強さ",
        choices=STRENGTH_CHOICES,
        initial='2',
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
        fields = ['mode', 'strength', 'color', 'turn', 'hint']
