(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeAnrObjectInstanceCtrl', [
            '$scope', '$mdToast', '$mdMedia', '$mdDialog', 'gettext', 'gettextCatalog', 'TableHelperService',
            'ModelService', 'ObjlibService', '$stateParams',
            BackofficeAnrObjectInstanceCtrl
        ]);

    /**
     * BO > KB > MODELS > MODEL DETAILS > OBJECT INSTANCE
     */
    function BackofficeAnrObjectInstanceCtrl($scope, $mdToast, $mdMedia, $mdDialog, gettext, gettextCatalog,
                                           TableHelperService, ModelService, ObjlibService, $stateParams) {
    }

})();