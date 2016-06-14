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
                controller: ['$scope', '$mdDialog', '$mdToast', 'DocModelService', 'Upload', CreateDocModelsDialogCtrl],
                templateUrl: '/views/dialogs/create.docmodels.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            })
                .then(function (docModel) {
                    $scope.updateDocModels();
                    $mdToast.show(
                        $mdToast.simple()
                            .textContent(gettext('The document has been created successfully.'))
                            .position('top right')
                            .hideDelay(3000)
                    );
                });
        };

    }


    function CreateDocModelsDialogCtrl($scope, $mdDialog, $mdToast, DocModelService, Upload) {
        $scope.docModel = {
            category: null,
            description: ''
        };

        $scope.uploadProgress = null;
        $scope.categories = DocModelService.getCategories()

        // Upload system
        $scope.$watch('file', function (newValue, oldValue) {
            console.log(newValue);
        });

        $scope.cancel = function () {
            $mdDialog.cancel();
        };

        $scope.create = function () {
            if (!$scope.file.$error) {
                $scope.uploadProgress = 0;

                Upload.upload({
                    url: '/api/docmodels',
                    file: $scope.file,
                    data: {category: $scope.docModel.category, description: $scope.docModel.description}
                }).then(function (resp) {
                        $scope.uploadProgress = null;
                        $mdDialog.hide($scope.docModel);
                    }, function (resp) {
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent(gettext('Error while uploading: ' + resp.status))
                                .position('top right')
                                .hideDelay(3000)
                        );
                    }
                    , function (evt) {
                        var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                        $scope.uploadProgress = progressPercentage;
                    })
            } else {
                $mdToast.show(
                    $mdToast.simple()
                        .textContent(gettext('File error: ' + $scope.file.$error))
                        .position('top right')
                        .hideDelay(3000)
                );
            }
        };
    }

})();