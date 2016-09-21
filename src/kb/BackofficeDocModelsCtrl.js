(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeDocModelsCtrl', [
            '$scope', '$mdDialog', '$mdMedia', '$http', 'DownloadService', 'toastr', 'gettextCatalog', 'DocModelService',
            BackofficeDocModelsCtrl
        ]);

    /**
     * KB > Document Models Controller for the Backoffice module
     */
    function BackofficeDocModelsCtrl($scope, $mdDialog, $mdMedia, $http, DownloadService, toastr, gettextCatalog,
                                     DocModelService) {
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
                controller: ['$scope', '$mdDialog', 'toastr', 'gettextCatalog', 'DocModelService', 'Upload', CreateDocModelsDialogCtrl],
                templateUrl: '/views/dialogs/create.docmodels.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            })
                .then(function (docModel) {
                    $scope.updateDocModels();
                    toastr.success(gettextCatalog.getString('The document "{{docModelLabel}}" has been created successfully.',
                        {docModelLabel: docModel.description}), gettextCatalog.getString('Creation successful'));
                });
        };

        $scope.editDocmodel = function (ev, docmodel) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'toastr', 'gettextCatalog', 'DocModelService', 'Upload', 'docmodel', CreateDocModelsDialogCtrl],
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
                    toastr.success(gettextCatalog.getString('The document "{{docModelLabel}}" has been updated successfully.',
                        {docModelLabel: docModel.description}), gettextCatalog.getString('Update successful'));
                });
        };

        $scope.deleteDocmodel = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the document "{{ label }}"?',
                    {label: item.description}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                DocModelService.deleteDocModel(item.id,
                    function () {
                        $scope.updateDocModels();
                        toastr.success(gettextCatalog.getString('The document "{{label}}" has been deleted.',
                            {label: item.description}), gettextCatalog.getString('Deletion successful'));
                    }
                );
            });
        };

        $scope.downloadDocmodel = function (ev, item) {
            $http.get(item.path,{responseType: 'arraybuffer'}).then(function (data) {
                var contentD = data.headers('Content-Disposition'),
                    contentT = data.headers('Content-Type');
                contentD = contentD.substring(0,contentD.length-1).split('filename="');
                contentD = contentD[contentD.length-1];
                DownloadService.downloadBlob(data.data, contentD,contentT);
            })

        }

        $scope.getCategoryLabel = function (id) {
            return DocModelService.getCategoryLabel(id);
        };

    }


    function CreateDocModelsDialogCtrl($scope, $mdDialog, toastr, gettextCatalog, DocModelService, Upload, docmodel) {
        if (docmodel) {
            $scope.docModel = docmodel;
        } else {
            $scope.docModel = {
                category: null,
                description: ''
            };
        }

        if (!$scope.docModel.id) {
            // Hide categories which already have an item
            DocModelService.getDocModels().then(function (existing_docmodels) {
                var all_categories = DocModelService.getCategories();
                $scope.categories = [];

                for (var i = 0; i < all_categories.length; ++i) {
                    var found = false;

                    for (var j = 0; j < existing_docmodels.docmodels.length; ++j) {
                        if (existing_docmodels.docmodels[j].category == all_categories[i].id) {
                            found = true;
                            break;
                        }
                    }

                    if (!found) {
                        $scope.categories.push(all_categories[i]);
                    }
                }
            });
        } else {
            $scope.categories = DocModelService.getCategories();
        }


        $scope.uploadProgress = null;

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
                        toastr.error(gettextCatalog.getString('The server returned the error code:') + ' ' + resp.status, gettextCatalog.getString('Error while uploading'))
                    }
                    , function (evt) {
                        var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                        $scope.uploadProgress = progressPercentage;
                    })
            } else if ($scope.file && $scope.file.$error) {
                toastr.error($scope.file.$error, gettextCatalog.getString('File error'));
            } else if ($scope.docModel.id > 0) {
                DocModelService.updateDocModel($scope.docModel, function () {
                    $mdDialog.hide($scope.docModel);
                }, function () {

                });
            } else {
                toastr.warning(gettextCatalog.getString('You must select a file'));
            }
        };
    }

})();
