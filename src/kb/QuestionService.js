(function () {

    angular
        .module('BackofficeApp')
        .factory('QuestionService', [ '$resource', 'gettextCatalog', QuestionService ]);

    function QuestionService($resource, gettextCatalog) {
        var self = this;

        self.QuestionResource = $resource('/api/questions/:questionId', { questionId: '@id' },
            {
                'update': {
                    method: 'PUT'
                },
                'query': {
                    isArray: false
                }
            });

        var getQuestions = function (params) {
            return self.QuestionResource.query(params).$promise;
        };

        var getQuestion = function (id) {
            return self.QuestionResource.query({questionId: id}).$promise;
        };

        var createQuestion = function (params, success, error) {
            new self.QuestionResource(params).$save(success, error);
        };

        var updateQuestion = function (params, success, error) {
            self.QuestionResource.update(params, success, error);
        };

        var deleteQuestion = function (id, success, error) {
            self.QuestionResource.delete({questionId: id}, success, error);
        };


        self.ChoiceResource = $resource('/api/questions-choices/:choiceId', { choiceId: '@id' },
            {
                'update': {
                    method: 'PUT'
                },
                'query': {
                    isArray: false
                }
            });

        var getChoices = function (params) {
            return self.ChoiceResource.query(params).$promise;
        };

        var getChoice = function (id) {
            return self.ChoiceResource.query({choiceId: id}).$promise;
        };

        var createChoice = function (params, success, error) {
            new self.ChoiceResource(params).$save(success, error);
        };

        var updateChoice = function (params, success, error) {
            self.ChoiceResource.update(params, success, error);
        };

        var deleteChoice = function (id, success, error) {
            self.ChoiceResource.delete({choiceId: id}, success, error);
        };

        return {
            getQuestions: getQuestions,
            getQuestion: getQuestion,
            createQuestion: createQuestion,
            deleteQuestion: deleteQuestion,
            updateQuestion: updateQuestion,

            getChoices: getChoices,
            getChoice: getChoice,
            createChoice: createChoice,
            deleteChoice: deleteChoice,
            updateChoice: updateChoice,

            getCategories: function () { return categories; },
            getCategoryLabel: function (id) { return categoriesLabels[id]; }
        };
    }

})
();