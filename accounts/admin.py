from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as AuthUserAdmin
from .models import UserProfile
from django.contrib.auth import get_user_model

User = get_user_model()


# ユーザープロファイルを管理画面に表示する
class ProfileInline(admin.StackedInline):
    model = UserProfile
    max_num = 1
    can_delete = False


class UserAdmin(AuthUserAdmin):
    inlines = [ProfileInline]


admin.site.register(User, UserAdmin)
