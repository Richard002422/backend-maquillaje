from rest_framework import serializers

from .models import LashAsset, LashProduct


class LashAssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = LashAsset
        fields = [
            "overlay_url",
            "canvas_width",
            "canvas_height",
            "anchor_inner_x",
            "anchor_inner_y",
            "anchor_outer_x",
            "anchor_outer_y",
            "eye_width_ref_px",
        ]


class LashProductSerializer(serializers.ModelSerializer):
    # DRF serializa DecimalField como STRING por defecto (p. ej. "14.90") —
    # precisión ante todo, pero el frontend espera `price: number`.
    # coerce_to_string=False lo emite como número JSON real.
    price = serializers.DecimalField(max_digits=12, decimal_places=2, coerce_to_string=False)
    asset = serializers.SerializerMethodField()

    class Meta:
        model = LashProduct
        fields = ["id", "name", "description", "price", "stock", "thumbnail_url", "style", "asset"]

    def get_asset(self, obj: LashProduct):
        # No usar getattr(obj, "asset", None): el accessor reverso de un
        # OneToOneField lanza LashAsset.DoesNotExist (no AttributeError) si
        # el producto no tiene asset — getattr con default NO la atraparía.
        try:
            asset = obj.asset
        except LashAsset.DoesNotExist:
            return None
        return LashAssetSerializer(asset).data
