(function () {

    angular
        .module('BackofficeApp')
        .factory('ErrorService', [ '$mdToast', 'gettextCatalog', ErrorService ]);

    function ErrorService($mdToast, gettextCatalog) {
        var self = this;

        var notifyFetchError = function (thing, status) {
            $mdToast.show(
                $mdToast.simple()
                    .textContent(gettextCatalog.getString('An error occurred while fetching {{ thing }}: {{status}}',
                        { thing: thing, status: status }))
                    .position('top right')
                    .hideDelay(3000)
            );
        };

        return {
            notifyFetchError: notifyFetchError
        };
    }

})();