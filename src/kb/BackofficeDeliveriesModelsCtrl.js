(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeDeliveriesModelsCtrl', [
            '$scope', '$mdDialog', '$mdMedia', '$http', 'DownloadService', 'toastr', 'gettextCatalog', 'DeliveriesModelsService',
            BackofficeDeliveriesModelsCtrl
        ]);

    /**
     * KB > Document Models Controller for the Backoffice module
     */
    function BackofficeDeliveriesModelsCtrl($scope, $mdDialog, $mdMedia, $http, DownloadService, toastr, gettextCatalog,
                                     DeliveriesModelsService) {
        $scope.deliveriesmodels = [];

        $scope.updateDeliveriesModels = function () {
            DeliveriesModelsService.getDeliveriesModels().then(function (data) {
                if (data.deliveriesmodels) {
                    $scope.deliveriesmodels = data.deliveriesmodels;
                }
            });
        }
        $scope.updateDeliveriesModels();

        $scope.createNewDeliveryModel = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'toastr', 'gettextCatalog', 'DeliveriesModelsService', 'Upload', CreateDeliveryModelDialogCtrl],
                templateUrl: '/views/dialogs/create.deliverymodel.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            })
                .then(function (deliveryModel) {
                    $scope.updateDeliveriesModels();
                    toastr.success(gettextCatalog.getString('The document "{{deliveryModelLabel}}" has been created successfully.',
                        {deliveryModelLabel: deliveryModel[$scope._langField('description')]}), gettextCatalog.getString('Creation successful'));
                });
        };

        $scope.editDeliveryModel = function (ev, deliverymodel) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'toastr', 'gettextCatalog', 'DeliveriesModelsService', 'Upload', 'deliverymodel', CreateDeliveryModelDialogCtrl],
                templateUrl: '/views/dialogs/create.deliverymodel.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen,
                locals: {
                    deliverymodel: deliverymodel
                }
            })
                .then(function (deliveryModel) {
                    $scope.updateDeliveriesModels();
                    toastr.success(gettextCatalog.getString('The document "{{deliveryModelLabel}}" has been updated successfully.',
                        {deliveryModelLabel: deliveryModel[$scope._langField('description')]}), gettextCatalog.getString('Update successful'));
                });
        };

        $scope.deleteDeliveryModel = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the document "{{ label }}"?',
                    {label: item.description}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                DeliveriesModelsService.deleteDeliveryModel(item.id,
                    function () {
                        $scope.updateDeliveriesModels();
                        toastr.success(gettextCatalog.getString('The document "{{label}}" has been deleted.',
                            {label: item[$scope._langField('description')]}), gettextCatalog.getString('Deletion successful'));
                    }
                );
            });
        };

        $scope.downloadDeliveryModel = function (ev, item) {
            $http.get(item.path,{responseType: 'arraybuffer'}).then(function (data) {
                var contentD = data.headers('Content-Disposition'),
                    contentT = data.headers('Content-Type');
                contentD = contentD.substring(0,contentD.length-1).split('filename="');
                contentD = contentD[contentD.length-1];
                DownloadService.downloadBlob(data.data, contentD,contentT);
            })

        }

        $scope.getCategoryLabel = function (id) {
            return DeliveriesModelsService.getCategoryLabel(id);
        };

    }


    function CreateDeliveryModelDialogCtrl($scope, $mdDialog, toastr, gettextCatalog, DeliveriesModelsService, Upload, deliverymodel) {
        if (deliverymodel) {
            deliverymodel.description = deliverymodel[$scope.$parent._langField('description')];
            $scope.deliveryModel = deliverymodel;
        } else {
            $scope.deliveryModel = {
                category: null,
                description: ''
            };
        }

        if (!$scope.deliveryModel.id) {
            // Hide categories which already have an item
            DeliveriesModelsService.getDeliveriesModels().then(function (existing_deliveriesmodels) {
                var all_categories = DeliveriesModelsService.getCategories();
                $scope.categories = [];

                for (var i = 0; i < all_categories.length; ++i) {
                    var found = false;

                    for (var j = 0; j < existing_deliveriesmodels.deliveriesmodels.length; ++j) {
                        if (existing_deliveriesmodels.deliveriesmodels[j].category == all_categories[i].id) {
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
            $scope.categories = DeliveriesModelsService.getCategories();
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
                    url: $scope.deliveryModel.id ? '/api/deliveriesmodels/' + $scope.deliveryModel.id : '/api/deliveriesmodels',
                    method: $scope.deliveryModel.id ? 'PUT' : 'POST',
                    file: $scope.file,
                    data: {category: $scope.deliveryModel.category, description: $scope.deliveryModel.description}
                }).then(function (resp) {
                        $scope.uploadProgress = null;
                        if (resp.status == 200) {
                            $mdDialog.hide($scope.deliveryModel);
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
            } else if ($scope.deliveryModel.id > 0) {
                DeliveriesModelsService.updateDeliveryModel($scope.deliveryModel, function () {
                    $mdDialog.hide($scope.deliveryModel);
                }, function () {

                });
            } else {
                toastr.warning(gettextCatalog.getString('You must select a file'));
            }
        };
    }

})();