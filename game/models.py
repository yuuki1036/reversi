from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class GameResult(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(verbose_name="プレイヤー",max_length=200)
    win_or_lose = models.BooleanField(verbose_name="結果")
    stone = models.IntegerField(verbose_name="石数")

    def __str__(self):
        return "kekka"
