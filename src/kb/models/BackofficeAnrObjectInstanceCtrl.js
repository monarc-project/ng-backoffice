(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeAnrObjectInstanceCtrl', [
            '$scope', 'toastr', '$mdMedia', '$mdDialog', 'gettext', 'gettextCatalog', 'TableHelperService',
            'ModelService', 'ObjlibService', '$stateParams',
            BackofficeAnrObjectInstanceCtrl
        ]);

    /**
     * BO > KB > MODELS > MODEL DETAILS > OBJECT INSTANCE
     */
    function BackofficeAnrObjectInstanceCtrl($scope, toastr, $mdMedia, $mdDialog, gettext, gettextCatalog,
                                           TableHelperService, ModelService, ObjlibService, $stateParams) {
    }

})();