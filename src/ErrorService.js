(function () {

    angular
        .module('BackofficeApp')
        .factory('ErrorService', [ 'toastr', 'gettextCatalog', ErrorService ]);

    function ErrorService(toastr, gettextCatalog) {
        var self = this;

        var notifyFetchError = function (thing, status) {
            toastr.error(gettextCatalog.getString('An error occurred while fetching {{ thing }}: {{status}}',
                        { thing: thing, status: status }));
        };

        return {
            notifyFetchError: notifyFetchError
        };
    }

})();