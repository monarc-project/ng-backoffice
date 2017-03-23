(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeKbModelsCtrl', [
            '$scope', 'toastr', '$mdMedia', '$mdDialog', 'gettextCatalog', 'TableHelperService',
            'ModelService', '$timeout',
            BackofficeKbModelsCtrl
        ]);

    /**
     * BO > KB > MODELS
     */
    function BackofficeKbModelsCtrl($scope, toastr, $mdMedia, $mdDialog, gettextCatalog, TableHelperService,
                                    ModelService, $timeout) {
        TableHelperService.resetBookmarks();

        $scope.models = TableHelperService.build($scope._langField('label'), 10, 1, '');

        $scope.updateModels = function () {
            $scope.models.promise = ModelService.getModels($scope.models.query);
            $scope.models.promise.then(
                function (data) {
                    $scope.models.items = data;
                }
            )
        };
        $scope.removeModelsFilter = function () {
            TableHelperService.removeFilter($scope.models);
            $scope.models.query.status = 'all';
        };

        TableHelperService.watchSearch($scope, 'models.query.filter', $scope.models.query, $scope.updateModels);

        TableHelperService.watchSearch($scope, 'models.query.status', $scope.models.query, $scope.updateModels);

        $scope.createNewModel = function (ev, model) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'ConfigService', 'model', CreateModelDialogCtrl],
                templateUrl: '/views/dialogs/create.models.html',
                targetEvent: ev,
                clickOutsideToClose: false,
                fullscreen: useFullScreen,
                locals: {
                    model: model
                }
            })
                .then(function (model) {
                    ModelService.createModel(model,
                        function () {
                            $scope.updateModels();
                            toastr.success(gettextCatalog.getString('The model has been created successfully.',
                                {modelLabel: $scope._langField(model,'label')}), gettextCatalog.getString('Creation successful'));
                        },

                        function () {
                            $scope.createNewModel(ev, model);
                        }
                    );
                });
        };

        $scope.editModel = function (ev, model) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            ModelService.getModel(model.id).then(function (modelData) {
                $mdDialog.show({
                    controller: ['$scope', '$mdDialog', 'ConfigService', 'model', CreateModelDialogCtrl],
                    templateUrl: '/views/dialogs/create.models.html',
                    targetEvent: ev,
                    clickOutsideToClose: false,
                    fullscreen: useFullScreen,
                    locals: {
                        'model': modelData
                    }
                })
                    .then(function (model) {
                        ModelService.updateModel(model,
                            function () {
                                $scope.updateModels();
                                toastr.success(gettextCatalog.getString('The model has been edited successfully.',
                                    {modelLabel: $scope._langField(model,'label')}), gettextCatalog.getString('Edition successful'));
                            },

                            function () {
                                $scope.editModel(ev, model);
                            }
                        );
                    });
            });
        };

        $scope.toggleModelStatus = function (item) {
            ModelService.patchModel(item.id, {'status': item.status ? 0 : 1}, function () {
                $scope.updateModels();
            });
        };

        $scope.deleteModel = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete model?',
                    {label: $scope._langField(item,'label')}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                ModelService.deleteModel(item.id,
                    function () {
                        $scope.updateModels();
                        toastr.success(gettextCatalog.getString('The model has been deleted.',
                            {label: $scope._langField(item,'label')}), gettextCatalog.getString('Deletion successful'));
                    }
                );
            });
        };

        $scope.deleteModelMass = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the {{count}} selected model(s)?',
                    {count: $scope.models.selected.length}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                angular.forEach($scope.models.selected, function (value, key) {
                    ModelService.deleteModel(value.id);
                });

                $timeout(function() { $scope.updateModels(); }, 500);
                toastr.success(gettextCatalog.getString('{{count}} models have been deleted.',
                    {count: $scope.models.selected.length}), gettextCatalog.getString('Deletion successful'));
                $scope.models.selected = [];

            }, function() {
            });
        };

        $scope.duplicateModel = function (item) {
            $scope.model_duplicating = true;
            ModelService.duplicateModel(item.id, function () {
                $scope.updateModels();
                $scope.model_duplicating = false;
                toastr.success(gettextCatalog.getString('The model has been duplicated sucessfully.',
                    {name: $scope._langField(item,'label')}), gettextCatalog.getString('Duplication successful'));
            });
        }
    }

    function CreateModelDialogCtrl($scope, $mdDialog, ConfigService, model) {
        $scope.languages = ConfigService.getLanguages();
        $scope.language = ConfigService.getDefaultLanguageIndex();

        if (model != undefined && model != null) {
            $scope.model = model;
            // Field is "isGeneric", but for UX reasons we display a "Specific" checkbox - invert the value here
            $scope.model.isGeneric = !$scope.model.isGeneric;
        } else {
            $scope.model = {
                label1: '',
                label2: '',
                label3: '',
                label4: '',
                description1: '',
                description2: '',
                description3: '',
                description4: '',
                isDefault: false,
                isScalesUpdatable: false,
                isGeneric: false,
                isRegulator: false,
                showRolfBrut: false
            };
        }

        $scope.$watch('model.isRegulator', function (newValue) {
            if (newValue) {
                $scope.model.isGeneric = true; // Which is inverted (see UX note) - a Regulator model may NOT be Generic
            }
        })

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            // Field is "isGeneric", but for UX reasons we display a "Specific" checkbox - invert the value here
            $scope.model.isGeneric = !$scope.model.isGeneric;

            $mdDialog.hide($scope.model);
        };
    }
})();
