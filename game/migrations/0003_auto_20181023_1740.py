# Generated by Django 2.1.2 on 2018-10-23 17:40

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('game', '0002_gameresult_score'),
    ]

    operations = [
        migrations.AlterField(
            model_name='gameresult',
            name='stone',
            field=models.CharField(max_length=10, verbose_name='石数'),
        ),
        migrations.AlterField(
            model_name='gameresult',
            name='win_or_lose',
            field=models.CharField(max_length=5, verbose_name='結果'),
        ),
    ]
