from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class GameResult(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(verbose_name="プレイヤー名",max_length=200)
    win_or_lose = models.CharField(verbose_name="勝敗",max_length=5)
    stone = models.CharField(verbose_name="結果",max_length=10)
    score = models.IntegerField(verbose_name="スコア")

    def __str__(self):
        return self.name
