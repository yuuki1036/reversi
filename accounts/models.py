from django.contrib.auth.models import AbstractUser, UserManager
from django.db import models
from django.db.models.signals import post_save


class CustomUserManager(UserManager):
    pass


class CustomUser(AbstractUser):
    objects = CustomUserManager
    pass


# Userと関連付くゲームステータスのモデル
class UserProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    play_count = models.IntegerField(
        verbose_name="対戦回数",
        default=0,
    )
    wins = models.IntegerField(
        verbose_name="勝った数",
        default=0,
    )
    loses = models.IntegerField(
        verbose_name="負けた数",
        default=0,
    )
    hi_score = models.IntegerField(
        verbose_name="ハイスコア",
        default=0
    )

    def __str__(self):
        return "ゲームステータス"


# UserProfileを作成する関数
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)


# User作成時に実行される
post_save.connect(create_user_profile, sender=CustomUser)
