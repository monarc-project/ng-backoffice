(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeKbModelsDetailsCtrl', [
            '$scope', '$mdToast', '$mdMedia', '$mdDialog', 'gettext', 'gettextCatalog', 'TableHelperService',
            'ModelService', '$stateParams',
            BackofficeKbModelsDetailsCtrl
        ]);

    /**
     * BO > KB > MODELS > MODEL DETAILS
     */
    function BackofficeKbModelsDetailsCtrl($scope, $mdToast, $mdMedia, $mdDialog, gettext, gettextCatalog,
                                           TableHelperService, ModelService, $stateParams) {
        ModelService.getModel($stateParams.modelId).then(function (data) {
            $scope.model = data;
        });

        TableHelperService.resetBookmarks();

        /*
         * CASES DIAGNOSTIC TAB
         */
        $scope.questions = TableHelperService.build('label1', 10, 1, '');

        $scope.selectQuestionsTab = function () {
            TableHelperService.watchSearch($scope, 'questions.query.filter', $scope.questions.query, $scope.updateQuestions, $scope.questions);
        };

        $scope.deselectQuestionsTab = function () {
            TableHelperService.unwatchSearch($scope.questions);
        };

        $scope.updateQuestions = function () {
            $scope.questions.promise = QuestionService.getQuestions($scope.questions.query);
            $scope.questions.promise.then(
                function (data) {
                    $scope.questions.items = data;
                }
            )
        };
        $scope.removeQuestionsFilter = function () {
            TableHelperService.removeFilter($scope.questions);
        };

        $scope.createNewQuestion = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'ModelService', 'ConfigService', CreateQuestionDialogCtrl],
                templateUrl: '/views/dialogs/create.questions.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            })
                .then(function (question) {


                    QuestionService.createQuestion(question,
                        function () {
                            $scope.updateQuestions();
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent(gettext('The question has been created successfully.'))
                                    .position('top right')
                                    .hideDelay(3000)
                            );
                        }
                    );
                });
        };

        $scope.editQuestion = function (ev, question) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            QuestionService.getQuestion(question.id).then(function (questionData) {
                $mdDialog.show({
                    controller: ['$scope', '$mdDialog', 'ModelService', 'ConfigService', 'question', CreateQuestionDialogCtrl],
                    templateUrl: '/views/dialogs/create.questions.html',
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    fullscreen: useFullScreen,
                    locals: {
                        'question': questionData
                    }
                })
                    .then(function (question) {
                        QuestionService.updateQuestion(question,
                            function () {
                                $scope.updateQuestions();
                                $mdToast.show(
                                    $mdToast.simple()
                                        .textContent(gettext('The question has been updated successfully.'))
                                        .position('top right')
                                        .hideDelay(3000)
                                );
                            }
                        );
                    });
            });
        };

        $scope.deleteQuestion = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete question "{{ label }}"?',
                    {label: item.label1}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                QuestionService.deleteQuestion(item.id,
                    function () {
                        $scope.updateQuestions();
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent(gettextCatalog.getString('The question "{{label}}" has been deleted.',
                                    {label: item.label1}))
                                .position('top right')
                                .hideDelay(3000)
                        );
                    }
                );
            });
        };

        $scope.deleteQuestionMass = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the {{count}} selected question(s)?',
                    {count: $scope.questions.selected.length}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                angular.forEach($scope.questions.selected, function (value, key) {
                    QuestionService.deleteQuestion(value.id,
                        function () {
                            $scope.updateQuestions();
                        }
                    );
                });

                $scope.questions.selected = [];

            });
        };

        /**
         * Evaluation scales
         */
        $scope.range = function (min, max) {
            var array = [];
            for (var v = min; v <= max; ++v) {
                array.push(v);
            }

            return array;
        }

        $scope.inlineNumberValidator = function (val) {
            return (parseInt(val) == val);
        };

        $scope.impacts_scale_min = 1;
        $scope.impacts_scale_max = 3;
        $scope.threats_scale_min = 1;
        $scope.threats_scale_max = 3;
        $scope.vulns_scale_min = 1;
        $scope.vulns_scale_max = 3;
    }

})();