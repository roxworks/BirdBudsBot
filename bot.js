import { TwitterApi, EDirectMessageEventTypeV1 } from 'twitter-api-v2';
import { TwitterApiRateLimitPlugin } from '@twitter-api-v2/plugin-rate-limit'
import dotenv from 'dotenv';
dotenv.config();


const API_KEY = process.env.API_KEY;
const API_KEY_SECRET = process.env.API_KEY_SECRET;
const BEARER_TOKEN = process.env.BEARER_TOKEN;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

// Instanciate with desired auth type (here's Bearer v2 auth)
const rateLimitPlugin = new TwitterApiRateLimitPlugin()
const twitterClient = new TwitterApi({
  appKey: API_KEY,
  appSecret: API_KEY_SECRET,
  accessToken: ACCESS_TOKEN, // oauth token from previous step (link generation)
  accessSecret: ACCESS_TOKEN_SECRET, // oauth token secret from previous step (link generation)
}, {plugins: [rateLimitPlugin]});

// Tell typescript it's a readonly app
// const roClient = twitterClient.readWrite;
const rwClient = twitterClient.readWrite
let myUserId;

let getId = async () => {
    if(myUserId) {
        return myUserId;
    }
    let thisUser = await twitterClient.v2.me();
    myUserId = thisUser.data.id;
}

let setWelcomeDM = async () => {
    console.log('setting welcome DM');
    const welcomeDm = await twitterClient.v1.newWelcomeDm('BirdBuds welcome message', { text: 'Thanks for signing up for BirdBuds! Expect new matches in your inbox soon <3' });

// This will handle all the boilerplate for you:
    await twitterClient.v1.setWelcomeDm(welcomeDm[EDirectMessageEventTypeV1.WelcomeCreate].id);
};

let doTheThing = async () => {
    console.log('------------------------')
    console.log('Checking again at ' + new Date());

    // GOAL: Get bot to follow me when I follow it
    await getId();

    // get the list of people following my account
    console.log('Getting list of people following me...');
    let pplFollowingMe = await twitterClient.v2.followers(myUserId, {
        max_results: 200,
        asPaginator: true
    });

    

    // paginate through the list of people following me
    let followingMe = [];
    // go through itereator
    for await (const page of pplFollowingMe) {
        // add each page to the followingMe array
        followingMe = followingMe.concat(page);
    }

    pplFollowingMe = {data: followingMe};

    console.log('Got list of people following me.');
    console.log(`${pplFollowingMe.data.length} people following me.`);
    console.log('Getting list of people I follow...');
    let pplIFollow = await twitterClient.v2.following(myUserId, {
        max_results: 200,
        asPaginator: true
    });

    // paginate through the list of people I follow
    let iFollow = [];
    // go through itereator
    for await (const page of pplIFollow) {
        // add each page to the followingMe array
        console.log(page);
        iFollow = iFollow.concat(page);
    }

    pplIFollow = {data: iFollow};

    console.log('Got list of people I follow.');
    console.log(`${pplIFollow.data.length} people I follow.`);

    console.log(pplIFollow.data);
    console.log(pplFollowingMe.data);
    let userIDs = pplFollowingMe.data.map(person => person.id);
    let userIDsIFollow = pplIFollow.data.map(person => person.id);

    // find all userIDs I don't follow that are following me
    let newFollowersIDs = userIDs.filter(id => !userIDsIFollow.includes(id));

    // find all userIDs I follow that are not following me
    let churnedUsers = userIDsIFollow.filter(id => !userIDs.includes(id));
    console.log('Churned Users: ', churnedUsers);

    // follow all of them
    for (let userToFollowId of newFollowersIDs) {
        console.log(`Following user ${userToFollowId}`);
        let followingResponse = await twitterClient.v2.follow(myUserId, userToFollowId);
        // send intro DM:
        //TODO: remove false lmao
        if(followingResponse.data.following) {
            await twitterClient.v1.sendDm({
                event: EDirectMessageEventTypeV1.DirectMessageEvents,
                recipient_id: userToFollowId,
                text: "Thanks for joining BirdBuds! If you''re seeing this for the second time, it means we need you to log back in :) Please complete signup here:",
                ctas: [{
                    type: 'web_url',
                    url: `https://app.birdbuds.com/v2/login?id=${userToFollowId}`,
                    label: 'Complete Signup',
                }]
            });
            //get rate limit
            let rateLimit = await rateLimitPlugin.v2.getRateLimit('users/:id/following');
            console.log(`Rate limit: ${rateLimit.limit ? rateLimit.remaining + '/' + rateLimit.limit : 'None.'}`);
            console.log(followingResponse);
            if(followingResponse.data.errors) {
                console.log('Error following user');
                console.log(followingResponse.data.errors);
            }
            else {
                console.log(followingResponse?.data?.following ? 'Successfully followed user' : 'Error following user');
            }
        }
    }

    // unfollow all of them
    for (let userToUnfollowId of churnedUsers) {
        console.log(`Unfollowing user ${userToUnfollowId}`);
        let unfollowingResponse = await twitterClient.v2.unfollow(myUserId, userToUnfollowId);
        //get rate limit
        let rateLimit = await rateLimitPlugin.v2.getRateLimit('users/:id/following');
        console.log(`Rate limit: ${rateLimit.limit ? rateLimit.remaining + '/' + rateLimit.limit : 'None.'}`);
        console.log(unfollowingResponse);
        if(unfollowingResponse.data.errors) {
            console.log('Error unfollowing user');
            console.log(unfollowingResponse.data.errors);
        }
        else {
            console.log(unfollowingResponse?.data?.following ? 'Error unfollowing user' : 'Successfully unfollowed user');
        }
    }

    if(newFollowersIDs.length == 0) {
        console.log('No new followers.');
    }
}

try {
    //do the thing every 1 mins
    let doTheThingSafely = () => {
        try{
            doTheThing().catch((e) => {
                console.log(e);
                console.log(e?.data?.errors);
            });
        } catch (e) {
            console.log(e);
        }
    };
    setInterval(doTheThingSafely, 1000 * 60);
    // doTheThingSafely();
    // setWelcomeDM();
}
catch (e) {
    console.log(e);
}