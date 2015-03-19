module.exports = {


  friendlyName: 'get-campaign-overview',


  description: 'return the ad set data, ad data, and ad creative, for all ad sets in campaign',


  extendedDescription: 'fetch all ads in ad set and then return top performing ad, determined by impressions served.',
  cacheable: true,

  inputs: {
    adCampaignGroupId: {
      example: '31231321312',
      description: 'an adcampaigngroup is a campaign',
      required: true
    },

    accessToken: {
      example: 'CAACEdEose0cBACBhZA7DJbYapwM7oZBt1EWhPiGqibBZAZAZCZCe6IOkfDRzrs1jyZCS93zSuj9GaNQQtxbny0jeSCqyBNaQUl3ocDiD3lO4GSboFm5B7NogSHFzTGYw0rdpndDKolQcfsS5nYeYwZAIKXF1WPzgGaGxNIDh36oZBHuazcN3WSNmL9jGyO9YmYlZBmZCcigBuMFvtXj4XlzNWyb',
      description: 'this is the facebook issued access token for a given user and app pair',
      required: true
    },
  },


  defaultExit: 'success',


  exits: {

    error: {
      description: 'The Facebook API returned an error (i.e. a non-2xx status code)',
    },

    success: {
      description: 'Here are the ad sets for the inputted campaign',
    },

  },


  fn: function (inputs,exits) {
    var async = require('async');
    var doJSONRequest = require('../lib/do-request');

    // fetch ad campaigns
    doJSONRequest({
      method: 'get',
      url: ['/v2.2/', inputs.adCampaignGroupId ].join(""),
      data: {
        'access_token': inputs.accessToken,
        'fields' : 'adcampaigns{id,daily_budget,campaign_status,stats}'
      },
      headers: {},
    },

    // handle the response from facebook
    function (err, responseBody) {
      if (err) { return exits.error(err); }

      // clean up the response into a useable js object literal
      var myJson = responseBody.adcampaigns;
      var removeUnusedValues = [];
      var len = myJson.data.length;
      for (var i=0; i<len; i++){
        removeUnusedValues.push({
          'id' : myJson.data[i].id,
          'daily_budget' : myJson.data[i].daily_budget,
          'clicks' : myJson.data[i].stats.clicks,
          'impressions' : myJson.data[i].stats.impressions
         });
       }

      // set the global response json here
      resultJson = {"adCampaigns" : removeUnusedValues };

      // prepare the array of ad campaign ids and indices for the next step in the process
      arrayAdCampaigns = [];
      for (var i = 0; i<resultJson.adCampaigns.length; i++){
        arrayAdCampaigns.push({ "id": resultJson.adCampaigns[i].id, "index" : i } );
      };

      // FETCH TOP AD FOR EACH AD CAMPAIGN
      var counter = 0;
      async.each(arrayAdCampaigns, function(adSet, callbackone) {




        var doJSONRequest = require('../lib/do-request');

        // look up all the ads for a given ad set
        doJSONRequest({
          method: 'get',
          url: ['/v2.2/', adSet.id, '/adgroups' ].join(""),
          data: {
            'access_token': inputs.accessToken,
            'fields' : 'id,stats'
          },
          headers: {},
        },
        // handle the response for looking up all the ads in a given ad set.
        function (err, response) {
          if (err) { return exits.error(err); }

          // PARSING RESPONSE INTO THE CORRECT FORMAT
          var newArray = [];
          var len = response.data.length;
          for (var i=0; i<len; i++){
            newArray.push({
              'id' : response.data[i].id,
            });
          }

           // rank by impressions
           newArray.sort(function(a,b){
            return b.impressions - a.impressions;
        })

          // append the existing json with the top ad information.
          resultJson.adCampaigns[adSet.index].topAd = newArray[0] ;
          counter++;
          if (arrayAdCampaigns.length == counter){
            callbackone(resultJson);
          }

          function callbackone(resultJson){
            var countChoco = 0;
            arrayAds = [];
            for (var i = 0; i<resultJson.adCampaigns.length; i++){
              arrayAds.push({ "id": resultJson.adCampaigns[i].topAd.id, "index" : i } );
            }
            async.each(arrayAds, function(ad, callbacktwo){

              function callbacktwo(result){
                return exits.success(result);
              }

              doJSONRequest({
                method: 'get',
                url: ['/v2.2/', ad.id ].join(""),
                data: {
                  'access_token': inputs.accessToken,
                  'fields' : 'adcreatives{id,image_url,object_story_spec}'
                },
                headers: {},
                },
                function (err, responseBody) {
                  if (err) { return exits.error(err); }

                  resultJson.adCampaigns[ad.index].topAd.creatives = responseBody.adcreatives.data;
                  countChoco++;
                  if (countChoco == arrayAds.length) {
                    callbacktwo(resultJson);
                  }
                }
              ) // end of doJSONRequest
            }) // end of async.each
          } // end of callback
        });
      });
    }); //doJSONRequest fetch ad campaigns
  } // fn function(inputs exits)
};



// return exits.success(resultJson);
