from django.contrib import admin

from .models import AIModel, AIModelVersion, LashAsset, LashProduct


class LashAssetInline(admin.StackedInline):
    model = LashAsset
    can_delete = False
    extra = 0


@admin.register(LashProduct)
class LashProductAdmin(admin.ModelAdmin):
    list_display = ("name", "style", "price", "stock", "active", "updated_at")
    list_filter = ("style", "active")
    search_fields = ("name", "description")
    inlines = [LashAssetInline]


@admin.register(AIModel)
class AIModelAdmin(admin.ModelAdmin):
    list_display = ("name", "created_at")
    search_fields = ("name",)


@admin.register(AIModelVersion)
class AIModelVersionAdmin(admin.ModelAdmin):
    list_display = ("ai_model", "version_label", "is_default", "released_at")
    list_filter = ("ai_model", "is_default")
