(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeKbOpRiskCtrl', [
            '$scope', '$mdToast', '$mdMedia', '$mdDialog', 'gettext', 'gettextCatalog', 'TableHelperService',
            'CategoryService', 'TagService',
            BackofficeKbOpRiskCtrl
        ]);

    /**
     * BO > KB > OPERATIONAL RISKS (ROLF)
     */
    function BackofficeKbOpRiskCtrl($scope, $mdToast, $mdMedia, $mdDialog, gettext, gettextCatalog, TableHelperService,
                                    CategoryService, TagService) {
        TableHelperService.resetBookmarks();

        /**
         * CATEGORIES
         */
        $scope.categories = TableHelperService.build('label1', 10, 1, '');

        $scope.updateCategories = function () {
            $scope.categories.promise = CategoryService.getCategories($scope.categories.query);
            $scope.categories.promise.then(
                function (data) {
                    $scope.categories.items = data;
                }
            )
        };
        $scope.removeCategoriesFilter = function () {
            TableHelperService.removeFilter($scope.categories);
        };

        TableHelperService.watchSearch($scope, 'categories.query.filter', $scope.categories.query, $scope.updateCategories);

        $scope.createNewCategory = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'ConfigService', CreateCategoryDialogCtrl],
                templateUrl: '/views/dialogs/create.categories.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            })
                .then(function (category) {
                    CategoryService.createCategory(category,
                        function () {
                            $scope.updateCategories();
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent(gettext('The category has been created successfully.'))
                                    .position('top right')
                                    .hideDelay(3000)
                            );
                        }
                    );
                });
        };

        $scope.editCategory = function (ev, category) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            CategoryService.getCategory(category.id).then(function (categoryData) {
                $mdDialog.show({
                    controller: ['$scope', '$mdDialog', 'ConfigService', 'category', CreateCategoryDialogCtrl],
                    templateUrl: '/views/dialogs/create.categories.html',
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    fullscreen: useFullScreen,
                    locals: {
                        'category': categoryData
                    }
                })
                    .then(function (category) {
                        CategoryService.updateCategory(category,
                            function () {
                                $scope.updateCategories();
                                $mdToast.show(
                                    $mdToast.simple()
                                        .textContent(gettext('The category has been updated successfully.'))
                                        .position('top right')
                                        .hideDelay(3000)
                                );
                            }
                        );
                    });
            });
        };

        $scope.deleteCategory = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete category "{{ label }}"?',
                    {label: item.label}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                CategoryService.deleteCategory(item.id,
                    function () {
                        $scope.updateCategories();
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent(gettextCatalog.getString('The category "{{label}}" has been deleted.',
                                    {label: item.label}))
                                .position('top right')
                                .hideDelay(3000)
                        );
                    }
                );
            });
        };


        /**
         * TAGS
         */
        $scope.tags = TableHelperService.build('label1', 10, 1, '');

        $scope.updateTags = function () {
            $scope.tags.promise = TagService.getTags($scope.tags.query);
            $scope.tags.promise.then(
                function (data) {
                    $scope.tags.items = data;
                }
            )
        };
        $scope.removeTagsFilter = function () {
            TableHelperService.removeFilter($scope.tags);
        };

        TableHelperService.watchSearch($scope, 'tags.query.filter', $scope.tags.query, $scope.updateTags);

        $scope.createNewTag = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'ConfigService', CreateTagDialogCtrl],
                templateUrl: '/views/dialogs/create.tags.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            })
                .then(function (tag) {
                    TagService.createTag(tag,
                        function () {
                            $scope.updateTags();
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent(gettext('The tag has been created successfully.'))
                                    .position('top right')
                                    .hideDelay(3000)
                            );
                        }
                    );
                });
        };

        $scope.editTag = function (ev, tag) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            TagService.getTag(tag.id).then(function (tagData) {
                $mdDialog.show({
                    controller: ['$scope', '$mdDialog', 'ConfigService', 'tag', CreateTagDialogCtrl],
                    templateUrl: '/views/dialogs/create.tags.html',
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    fullscreen: useFullScreen,
                    locals: {
                        'tag': tagData
                    }
                })
                    .then(function (tag) {
                        TagService.updateTag(tag,
                            function () {
                                $scope.updateTags();
                                $mdToast.show(
                                    $mdToast.simple()
                                        .textContent(gettext('The tag has been updated successfully.'))
                                        .position('top right')
                                        .hideDelay(3000)
                                );
                            }
                        );
                    });
            });
        };

        $scope.deleteTag = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete tag "{{ label }}"?',
                    {label: item.label}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                TagService.deleteTag(item.id,
                    function () {
                        $scope.updateTags();
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent(gettextCatalog.getString('The tag "{{label}}" has been deleted.',
                                    {label: item.label}))
                                .position('top right')
                                .hideDelay(3000)
                        );
                    }
                );
            });
        };
    }

    function CreateCategoryDialogCtrl($scope, $mdDialog, ConfigService, category) {
        $scope.languages = ConfigService.getLanguages();
        $scope.language = ConfigService.getDefaultLanguageIndex();

        if (category != undefined && category != null) {
            $scope.category = category;
        } else {
            $scope.category = {
                code: '',
                label1: '',
                label2: '',
                label3: '',
                label4: ''
            };
        }

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.category);
        };
    }

    function CreateTagDialogCtrl($scope, $mdDialog, ConfigService, tag) {
        $scope.languages = ConfigService.getLanguages();
        $scope.language = ConfigService.getDefaultLanguageIndex();

        if (tag != undefined && tag != null) {
            $scope.tag = tag;
        } else {
            $scope.tag = {
                code: '',
                label1: '',
                label2: '',
                label3: '',
                label4: ''
            };
        }

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.tag);
        };
    }
})();