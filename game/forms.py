from django import forms


class GameSettingForm(forms.Form):

    MODE_CHOICE = (
        ('computer', '１人プレイ'),
        ('person', '２人プレイ'),
    )

    COLOR_CHOICE = (
        ('black', '黑'),
        ('white', '白'),
    )

    PLAY_CHOICE = (
        ('i', '自分'),
        ('y', '相手'),
    )

    mode = forms.ChoiceField(
        label='対戦モード',
        choices=MODE_CHOICE,
        initial='computer',
    )

    color = forms.ChoiceField(
        label='自分のいろ',
        choices=COLOR_CHOICE,
        initial='black',
    )

    turn = forms.ChoiceField(
        label='先手',
        choices=PLAY_CHOICE,
        initial='i',
    )

    hint = forms.BooleanField(
        label='ヒントモード',
        initial=False,
        required=False,
    )

    class Meta:
        fields = ['mode', 'color', 'turn', 'hint']
