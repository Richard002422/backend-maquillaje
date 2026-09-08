from django.urls import path

from .views import LashProductDetailView, LashProductListView

urlpatterns = [
    path("products/", LashProductListView.as_view(), name="lash-product-list"),
    path("products/<uuid:pk>/", LashProductDetailView.as_view(), name="lash-product-detail"),
]
