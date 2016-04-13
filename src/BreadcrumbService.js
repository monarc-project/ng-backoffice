(function () {

        angular
            .module('BackofficeApp')
            .factory('BreadcrumbService', [
                BreadcrumbService
            ]);

        function BreadcrumbService() {
            var self = this;

            self.items = [];


            var getItems = function () {
                return self.items;
            };

            var setItems = function (items) {
                self.items = items;
            };

            return {
                getItems: getItems,
                setItems: setItems
            };
        }

    })
();