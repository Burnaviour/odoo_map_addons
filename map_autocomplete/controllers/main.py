from odoo import http
from odoo.http import request
import requests
import json


class MapAutocompleteController(http.Controller):

    @http.route("/map_autocomplete/search", type="json", auth="user")
    def search_addresses(self, search_term, **kwargs):
        try:
            print(search_term)
            headers = {"User-Agent": "Your Odoo App (contact@example.com)"}  # Replace with your info
            url = f"https://nominatim.openstreetmap.org/search?format=json&q={search_term}&addressdetails=1&limit=5"

            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()

            data = response.json()
            return {
                "result": [
                    {"display_name": item.get("display_name", ""), "lat": item.get("lat", 0), "lon": item.get("lon", 0)}
                    for item in data
                ]
            }

        except requests.exceptions.RequestException as e:
            return {"error": str(e)}
        except json.JSONDecodeError:
            return {"error": "Invalid response from geocoding service"}
