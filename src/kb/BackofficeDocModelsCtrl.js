(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeDocModelsCtrl', [
            '$scope', '$mdDialog', '$mdMedia', '$mdToast', 'gettextCatalog', 'gettext', 'DocModelService',
            BackofficeDocModelsCtrl
        ]);

    /**
     * KB > Document Models Controller for the Backoffice module
     */
    function BackofficeDocModelsCtrl($scope, $mdDialog, $mdMedia, $mdToast, gettextCatalog,
                                     gettext, DocModelService) {
        $scope.docmodels = [];

        $scope.updateDocModels = function () {
            DocModelService.getDocModels().then(function (data) {
                if (data.docmodels) {
                    $scope.docmodels = data.docmodels;
                }
            });
        }
        $scope.updateDocModels();

        $scope.createNewDocModel = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'DocModelService', 'Upload', CreateDocModelsDialogCtrl],
                templateUrl: '/views/dialogs/create.docmodels.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            })
                .then(function (docModel) {
                    DocModelService.createDocModel(docModel,
                        function () {
                            $scope.updateDocModels();
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent(gettext('The docModel has been created successfully.'))
                                    .position('top right')
                                    .hideDelay(3000)
                            );
                        }
                    );
                });
        };

    }


    function CreateDocModelsDialogCtrl($scope, $mdDialog, DocModelService, Upload) {
        $scope.docModel = {
            category: null,
            description: '',
            file: null
        };

        $scope.uploadProgress = null;
        $scope.categories = DocModelService.getCategories()

        // Upload system
        $scope.$watch('file', function () {
            if ($scope.file != null) {
                $scope.upload($scope.file);
            }
        })

        $scope.upload = function (file) {
            if (file) {
                if (!file.$error) {
                    $scope.uploadProgress = 0;

                    Upload.upload({
                        url: '/api/models/upload',
                        file: file
                    }).then(function (resp) {
                            $scope.uploadProgress = null;
                            $scope.docModel.file = resp.data.id;
                        }, function (resp) {

                        }
                        , function (evt) {
                            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                            $scope.uploadProgress = progressPercentage;
                        })
                }
            }
        }


        $scope.cancel = function () {
            $mdDialog.cancel();
        };

        $scope.create = function () {
            $mdDialog.hide($scope.docModel);
        };
    }

})();