from rest_framework import filters, generics
from rest_framework.permissions import AllowAny

from .models import LashProduct
from .pagination import ItemsPageNumberPagination
from .serializers import LashProductSerializer


class QSearchFilter(filters.SearchFilter):
    # DRF usa `?search=` por defecto -- se fuerza a `?q=` para mantener la
    # misma convención que GET /v1/products?q=... en Express.
    search_param = "q"


class LashProductListView(generics.ListAPIView):
    """
    GET /v1/lash-tryon/products/?q=...&style=...

    Público a propósito (sin auth) -- mismo criterio que GET /v1/products en
    Express: navegar el catálogo no requiere sesión. Solo dejar constancia
    de un resultado probado (Fase 4/5, endpoint de fotos) sí la exige.

    NO existe un endpoint /search/ separado (a diferencia del ejemplo de la
    spec original): con un catálogo de este tamaño, un único endpoint
    filtrable por `q` es suficiente y evita mantener dos rutas que hacen
    fundamentalmente lo mismo. Si el catálogo crece mucho, esto es lo primero
    que se revisita (búsqueda dedicada con ranking, no un LIKE simple).
    """

    serializer_class = LashProductSerializer
    permission_classes = [AllowAny]
    pagination_class = ItemsPageNumberPagination
    filter_backends = [QSearchFilter]
    search_fields = ["name", "description"]

    def get_queryset(self):
        qs = LashProduct.objects.filter(active=True).select_related("asset").order_by("name")
        style = self.request.query_params.get("style")
        if style:
            qs = qs.filter(style=style)
        return qs


class LashProductDetailView(generics.RetrieveAPIView):
    """GET /v1/lash-tryon/products/{id}/ — público, mismo criterio que arriba."""

    queryset = LashProduct.objects.filter(active=True).select_related("asset")
    serializer_class = LashProductSerializer
    permission_classes = [AllowAny]
