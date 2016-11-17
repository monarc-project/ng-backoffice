(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeQuestionsCtrl', [
            '$scope', '$mdDialog', '$mdMedia', 'toastr', 'gettextCatalog', 'QuestionService',
            BackofficeQuestionsCtrl
        ]);

    /**
     * KB > Questions Controller for the Backoffice module
     */
    function BackofficeQuestionsCtrl($scope, $mdDialog, $mdMedia, toastr, gettextCatalog, QuestionService) {
        $scope.questions = [];

        $scope.updateQuestions = function () {
            QuestionService.getQuestions().then(function (data) {
                if (data.questions) {
                    $scope.questions = data.questions;
                }
            });
        }
        $scope.updateQuestions();

        $scope.createNewQuestion = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', 'ConfigService', '$mdDialog', 'QuestionService', CreateQuestionDialogCtrl],
                templateUrl: '/views/dialogs/create.questions.html',
                targetEvent: ev,
                clickOutsideToClose: false,
                fullscreen: useFullScreen
            })
                .then(function (question) {
                    QuestionService.createQuestion(question,
                        function () {
                            $scope.updateQuestions();
                            toastr.success(gettextCatalog.getString('The question "{{label}}" has been created successfully.',
                                {label: question[$scope._langField('label')]}), gettextCatalog.getString('Creation successful'));
                        }
                    );
                });
        };

        $scope.editQuestion = function (ev, item) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', 'ConfigService', '$mdDialog', 'QuestionService', 'question', CreateQuestionDialogCtrl],
                templateUrl: '/views/dialogs/create.questions.html',
                targetEvent: ev,
                clickOutsideToClose: false,
                fullscreen: useFullScreen,
                locals: {
                    question: item
                }
            })
                .then(function (question) {
                    QuestionService.updateQuestion(question,
                        function () {
                            $scope.updateQuestions();
                            toastr.success(gettextCatalog.getString('The question "{{questionLabel}}" has been updated successfully.',
                                {questionLabel: question.description1}), gettextCatalog.getString('Update successful'));
                        }
                    );
                });
        };


        $scope.deleteQuestion = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete this question?',
                    {label: item.description}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                QuestionService.deleteQuestion(item.id,
                    function () {
                        $scope.updateQuestions();
                        toastr.success(gettextCatalog.getString('The question has been deleted.',
                            {label: item.description}), gettextCatalog.getString('Deletion successful'));
                    }
                );
            });
        };
    }


    function CreateQuestionDialogCtrl($scope, ConfigService, $mdDialog, QuestionService, question) {
        $scope.languages = ConfigService.getLanguages();
        $scope.language = ConfigService.getDefaultLanguageIndex();

        if (question) {
            $scope.question = angular.copy(question);

            if ($scope.question.type_id) {
                $scope.question.type = $scope.question.type_id;
            }
        } else {
            $scope.question = {
                type: null,
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
            $mdDialog.hide($scope.question);
        };
    }

})();
