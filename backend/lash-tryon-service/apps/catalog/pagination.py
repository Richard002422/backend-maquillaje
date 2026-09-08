from rest_framework.pagination import PageNumberPagination


class ItemsPageNumberPagination(PageNumberPagination):
    """
    Igual que PageNumberPagination, pero la clave de la lista es `items` en
    vez de `results` — mismo nombre que ya usa `GET /v1/products` en Express
    (backend/api/src/routes/products.ts). Un frontend que consume ambos
    backends no debería tener que recordar dos convenciones de "lista
    paginada" distintas.
    """

    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 100

    def get_paginated_response(self, data):
        response = super().get_paginated_response(data)
        response.data["items"] = response.data.pop("results")
        return response
