/** @odoo-module **/

import { KeepLast } from "@web/core/utils/concurrency";
import { useService } from "@web/core/utils/hooks";
import { _t } from "@web/core/l10n/translation";

export function useMapAutocomplete() {
    const keepLast = new KeepLast();
    const orm = useService("orm");
    const http = useService("http");
    const notification = useService("notification");

    async function autocomplete(value) {
        try {
            const url =`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&addressdetails=1&limit=5`
            const prom = http.get(url);
            const response = await keepLast.add(prom);
            
            if (response.error) {
                throw new Error(response.error);
            }

            return response.map(item => ({
                label: item.display_name,
                lat: item.lat,
                lon: item.lon,
                address: item.address,
                classList: 'osm-autocomplete-item'
            }));

        } catch (error) {
            notification.add(error.message, { type: 'danger' });
            return [];
        }
    }

    async function getCreateData(selection) {
        return {
            name: selection.label,
            street: selection.address.street,
            city: selection.address.city,
            zip: selection.address.zip,
            country_id: await _getCountryId(selection.address.country_code),
            partner_latitude: selection.lat,
            partner_longitude: selection.lon
        };
    }

    async function _getCountryId(code) {
        return orm.searchRead(
            'res.country',
            [('code', '=', code)],
            ['id'],
            limit=1
        ).then(res => res[0]?.id || false);
    }

    return { autocomplete, getCreateData };
}