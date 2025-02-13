/** @odoo-module **/

import { Component, useState, useEffect } from "@odoo/owl";
import { useDebounced } from "@web/core/utils/timing";
import { useService } from "@web/core/utils/hooks";
import { AutoComplete } from "@web/core/autocomplete/autocomplete";
import { useChildRef } from "@web/core/utils/hooks";
import { registry } from "@web/core/registry";
import { KeepLast } from "@web/core/utils/concurrency";
import { _t } from "@web/core/l10n/translation";
import { CharField, charField } from "@web/views/fields/char/char_field";
import { useInputField } from "@web/views/fields/input_field_hook";
const NOMINATIM_SERVICE_URL = "https://nominatim.openstreetmap.org/search?format=json&q=";

export class MapAutoComplete extends CharField {
    static props = {
        ...CharField.props,
       
    };
    setup() {
        super.setup();

        // Initialize state: input value, suggestions, loading flag and open state.
        this.state = useState({
            inputValue: this.props.record.data[this.props.name] || "",
            suggestions: [],
            isLoading: false,
            open: false,
            is_auto_complete: true,
        });
        this.rpc = useService("rpc");
        
        // Bind methods.
        // this.onInput = this.onInput.bind(this);
        this.onSelect = this.onSelect.bind(this);
        // this.debouncedSearch = useDebounced(this.searchAddresses, 200, { immediate: true });
        this.inputRef = useChildRef();

        useInputField({
            getValue: () => this.props.record.data[this.props.name] || "",
            parse: (v) => this.parse(v),
            ref: this.inputRef,
        });

     
    }

 
    // Called when an option is selected.
    async getAddressSuggestions(value) {
        try {
            // Build a query string using a fixed set of parameters.
            const queryParams = new URLSearchParams({
                format: 'json',
                q: value,
                addressdetails: 1,
                // limit: 5,
            }).toString();
    
            // Set up an AbortController for a 5-second timeout.
            const controller = new AbortController();
            const signal = controller.signal;
            setTimeout(() => controller.abort(), 5000);
    
            // Build the full URL with the query string.
            const url = `${NOMINATIM_SERVICE_URL}?${queryParams}`;
            console.log("Fetching URL:", url);
    
            const response = await fetch(url, {
                signal,
                headers: {
                    'User-Agent': 'Your Odoo App (contact@example.com)' // Replace with your info.
                }
            });
    
            if (!response.ok) throw new Error(response.statusText);
            const data = await response.json();
            console.log("Response data:", data);
    
            // Map the response to an array of suggestions with the added classList property.
            const suggestions = data.map(item => ({
                label: item.display_name,
                item: {
                    display_name: item.display_name,
                    lat: item.lat,
                    lon: item.lon,
                },
                classList: 'osm_autocomplete_dropdown_char'
            }));
    
            return suggestions;
        } catch (e) {
            console.warn("OpenStreetMap API error:", e);
            return [{
                label: _t("Could not contact geocoding service"),
                unselectable: true,
                classList: 'osm_autocomplete_dropdown_char'
            }];
        }
    }
    
    get sources() {
        return [
            {
                options: async (request) => {
                    if (request?.length > 2) {
                        const res = await this.getAddressSuggestions(request);
                        console.log("Suggestions:", res);
                        return res;
                    }
                    return [];
                },
                optionTemplate: "map_autocomplete.AutoCompleteItem",
                placeholder: _t("Searching addresses..."),
            }
        ];
    }
    
    onSelect(option) {
        this.state.inputValue = option.label;
   
    }
}

MapAutoComplete.template = "map_autocomplete.MapAutoComplete";
MapAutoComplete.components = {
    ...CharField.components,
    AutoComplete,
};


MapAutoComplete.supportedTypes = ["char"];

export const MapAutoCompleteCharField = {
    ...charField,
    component: MapAutoComplete,
};

registry.category("fields").add("map_auto_complete", MapAutoCompleteCharField);
