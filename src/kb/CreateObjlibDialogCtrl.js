function CreateObjlibDialogCtrl($scope, $mdDialog, toastr, gettext, AssetService, ObjlibService, ConfigService, TagService, $q, objLibDialog, objlib) {
    $scope.languages = ConfigService.getLanguages();
    $scope.language = ConfigService.getDefaultLanguageIndex();
    $scope.assetSearchText = '';

    if (objlib != undefined && objlib != null) {
        $scope.objlib = objlib;
    } else {
        $scope.objlib = {
            mode: 1,
            scope: 1,
            label1: '',
            label2: '',
            label3: '',
            label4: '',
            name1: '',
            name2: '',
            name3: '',
            name4: '',
            implicitPosition: 2,
            previous: null
        };
    }

    $scope.queryAssetSearch = function (query) {
        var q = $q.defer();

        AssetService.getAssets({filter: query}).then(function (x) {
            q.resolve(x.assets);
        }, function (x) {
            q.reject(x);
        });

        return q.promise;
    };

    $scope.selectedAssetItemChange = function (item) {
        $scope.objlib.asset = item;
    };

    $scope.createCategory = function (ev, catName) {
        $mdDialog.show({
            controller: ['$scope', '$mdDialog', '$q', 'gettext', 'ConfigService', 'ObjlibService', 'catName', CreateObjlibCategoryDialogCtrl],
            templateUrl: '/views/dialogs/create.objlibs.categories.html',
            clickOutsideToClose: true,
            locals: {
                'catName': catName
            }
        })
            .then(function (category) {
                if (category.previous) {
                    category.previous = category.previous.id;
                }

                ObjlibService.createObjlibCat(category,
                    function (cat) {
                        // Set the created category on the object
                        ObjlibService.getObjlibCat(cat.id).then(function (category) {
                            $scope.objlib.category = category;

                            // Display the dialog again
                            objLibDialog.editObjlib(null, $scope.objlib);
                        });

                        toastr.success(gettext('The category has been created successfully.'), gettext('Creation successful'));
                    }
                );

            }, function () {
                objLibDialog.editObjlib(null, $scope.objlib);
            });
    };

    $scope.editCategory = function (ev, cat) {
        ObjlibService.getObjlibCat(cat.id).then(function (cat) {
            $mdDialog.show({
                controller: ['$scope', '$mdDialog', '$q', 'gettext', 'ConfigService', 'ObjlibService', 'catName', 'category', CreateObjlibCategoryDialogCtrl],
                templateUrl: '/views/dialogs/create.objlibs.categories.html',
                clickOutsideToClose: true,
                locals: {
                    'catName': null,
                    'category': cat
                }
            })
                .then(function (category) {
                    ObjlibService.updateObjlibCat(category,
                        function () {
                            objLibDialog.editObjlib(null, $scope.objlib);
                            toastr.success(gettext('The category has been updated successfully.'), gettext('Update successful'));
                        }
                    );
                }, function () {
                    objLibDialog.editObjlib(null, $scope.objlib);
                });
        });
    };

    $scope.queryCategorySearch = function (query) {
        var q = $q.defer();

        ObjlibService.getObjlibsCats({filter: query}).then(function (x) {
            // Recursively build items
            var buildItemRecurse = function (children, depth) {
                var output = [];

                for (var i = 0; i < children.length; ++i) {
                    var child = children[i];

                    for (var j = 0; j < depth; ++j) {
                        child.label1 = " >> " + child.label1;
                    }

                    output.push(child);

                    if (child.child.length > 0) {
                        var child_output = buildItemRecurse(child.child, depth + 1);
                        output = output.concat(child_output);
                    }
                }

                return output;
            };

            q.resolve(buildItemRecurse(x.categories, 0));

        }, function (x) {
            q.reject(x);
        });

        return q.promise;
    };

    $scope.selectedCategoryItemChange = function (item) {
        $scope.objlib.category = item;
    };

    $scope.queryTagSearch = function (query) {
        var q = $q.defer();

        TagService.getTags({filter: query}).then(function (x) {
            q.resolve(x.tags);
        }, function (x) {
            q.reject(x);
        });

        return q.promise;
    };

    $scope.selectedTagItemChange = function (item) {
        $scope.objlib.rolfTag = item;
    };

    $scope.selectedPreviousCatItemChange = function (item) {
        $scope.objlib.previous = item;
    };


    $scope.cancel = function() {
        $mdDialog.cancel();
    };

    $scope.create = function() {
        if ($scope.objlib.previous) {
            $scope.objlib.previous = $scope.objlib.previous.id;
        }
        $mdDialog.hide($scope.objlib);
    };
}

function CreateObjlibCategoryDialogCtrl($scope, $mdDialog, $q, gettext, ConfigService, ObjlibService, catName, category) {
    $scope.languages = ConfigService.getLanguages();
    $scope.language = ConfigService.getDefaultLanguageIndex();
    $scope.implicitPosition = null;
    $scope.showConfirmDeletion = false;

    if (category != undefined && category != null) {
        $scope.category = category;
    } else {
        $scope.category = {
            parent: null,
            implicitPosition: null,
            position: null,
            label1: catName,
            label2: '',
            label3: '',
            label4: '',
        };
    }

    $scope.destroy = function() {
        $scope.showConfirmDeletion = true;
    };

    $scope.destroyConfirm = function() {
        ObjlibService.deleteObjlibCat($scope.category.id, function () {
            $mdDialog.cancel();
        });
    };

    $scope.cancel = function() {
        $mdDialog.cancel();
    };

    $scope.create = function() {
        if ($scope.implicitPosition == 1 || $scope.implicitPosition == 2) {
            // -1 ==> At the beginning
            // -2 ==> In the end
            $scope.category.position = -$scope.implicitPosition;
        }

        if ($scope.category.parent) {
            $scope.category.parent = $scope.category.parent.id;
        }

        if ($scope.category.previous) {
            $scope.category.previous = $scope.category.previous.id;
        }

        $mdDialog.hide($scope.category);
    };

    $scope.queryCategorySearch = function (query) {
        var q = $q.defer();

        ObjlibService.getObjlibsCats({filter: query}).then(function (x) {
            if (x && x.categories) {
                // Recursively build items
                var buildItemRecurse = function (children, depth) {
                    var output = [];

                    for (var i = 0; i < children.length; ++i) {
                        var child = children[i];

                        for (var j = 0; j < depth; ++j) {
                            child.label1 = " >> " + child.label1;
                        }

                        output.push(child);

                        if (child.child.length > 0) {
                            var child_output = buildItemRecurse(child.child, depth + 1);
                            output = output.concat(child_output);
                        }
                    }

                    return output;
                };

                q.resolve(buildItemRecurse(x.categories, 0));
            } else {
                q.reject();
            }
        }, function (x) {
            q.reject(x);
        });

        return q.promise;
    };

    $scope.queryCategoryChildrenSearch = function (query) {
        var q = $q.defer();

        ObjlibService.getObjlibsCats({filter: query, lock: true, parentId: parentId}).then(function (x) {
            if (x && x.categories) {
                q.resolve(x.categories);
            } else {
                q.reject();
            }
        }, function (x) {
            q.reject(x);
        });

        return q.promise;
    };

    $scope.selectedParentCatItemChange = function (item) {
        $scope.category.parent = item;
    };

    $scope.selectedPreviousCatItemChange = function (item) {
        $scope.category.previous = item;
    };
}