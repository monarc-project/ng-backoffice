(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeDocModelsCtrl', [
            '$scope', '$mdDialog', '$mdMedia', 'toastr', 'gettextCatalog', 'gettext', 'DocModelService',
            BackofficeDocModelsCtrl
        ]);

    /**
     * KB > Document Models Controller for the Backoffice module
     */
    function BackofficeDocModelsCtrl($scope, $mdDialog, $mdMedia, toastr, gettextCatalog,
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
                controller: ['$scope', '$mdDialog', 'toastr', 'gettext', 'DocModelService', 'Upload', CreateDocModelsDialogCtrl],
                templateUrl: '/views/dialogs/create.docmodels.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            })
                .then(function (docModel) {
                    $scope.updateDocModels();
                    toastr.success(gettext('The document has been created successfully.'), gettext('Creation successful'));
                });
        };

        $scope.editDocmodel = function (ev, docmodel) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'toastr', 'gettext', 'DocModelService', 'Upload', 'docmodel', CreateDocModelsDialogCtrl],
                templateUrl: '/views/dialogs/create.docmodels.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen,
                locals: {
                    docmodel: docmodel
                }
            })
                .then(function (docModel) {
                    $scope.updateDocModels();
                    toastr.success(gettext('The document has been updated successfully.'), gettext('Update successful'));
                });
        };

        $scope.deleteDocmodel = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the document "{{ label }}"?',
                    {label: item.description}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                DocModelService.deleteDocModel(item.id,
                    function () {
                        $scope.updateDocModels();
                        toastr.success(gettextCatalog.getString('The document "{{label}}" has been deleted.',
                                    {label: item.description}), gettext('Deletion successful'));
                    }
                );
            });
        };

        $scope.getCategoryLabel = function (id) {
            return DocModelService.getCategoryLabel(id);
        };

    }


    function CreateDocModelsDialogCtrl($scope, $mdDialog, toastr, gettext, DocModelService, Upload, docmodel) {
        if (docmodel) {
            $scope.docModel = docmodel;
        } else {
            $scope.docModel = {
                category: null,
                description: ''
            };
        }

        $scope.uploadProgress = null;
        $scope.categories = DocModelService.getCategories()

        // Upload system
        $scope.cancel = function () {
            $mdDialog.cancel();
        };

        $scope.create = function () {
            if ($scope.file && !$scope.file.$error) {
                $scope.uploadProgress = 0;

                Upload.upload({
                    url: $scope.docModel.id ? '/api/docmodels/' + $scope.docModel.id : '/api/docmodels',
                    method: $scope.docModel.id ? 'PUT' : 'POST',
                    file: $scope.file,
                    data: {category: $scope.docModel.category, description: $scope.docModel.description}
                }).then(function (resp) {
                        $scope.uploadProgress = null;
                        if (resp.status == 200) {
                            $mdDialog.hide($scope.docModel);
                        }
                    }, function (resp) {
                        toastr.error(gettext('The server returned the error code:') + ' ' + resp.status, gettext('Error while uploading'))
                    }
                    , function (evt) {
                        var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                        $scope.uploadProgress = progressPercentage;
                    })
            } else if ($scope.file && $scope.file.$error) {
                toastr.error($scope.file.$error, gettext('File error'));
            } else if ($scope.docModel.id > 0) {
                DocModelService.updateDocModel($scope.docModel, function () {
                    $mdDialog.hide($scope.docModel);
                }, function () {

                });
            } else {
                toastr.warning(gettext('You must select a file'));
            }
        };
    }

})();