// From a list of twitter users, we must find all mutual followers
// then maximize for number of matches
export const findMatches = (usersToMutualFollowers) => {
    // this is literally a graph matching algorithm
    // I LOVE COMPUTERS
    // ok literally edmonds
    // so the question is how do we generate the "graph"?
    // we have a list of twitter users and their mutual followers
    // for each user, create an edge from each of their mutual followers also following birdbuds
    // 
}

// Algo
// 1. We have to only care about people following @birdbuds, filter out anyone else
    // This is actually kinda easy because we can just take out followers list and filter all other lists
    // We can use the twitter API to only get those followers that are within this list, that is literally an endpoint feature
// 2. Once we've done all of that, we just need to generate an undirected graph of all the followers
    // So basically for each user we just make edges from everyone they follow after the filtering
// 3. Run the algorithm!

// General notes
// This gets really fucking complicated beyond 100 followers
// Just for API limits this will take hours to run lmao
// We can maximally search for 100 followers at a time, and get 1 request per minute
// so if we get n users... for each user we have to make n/100 requests (let's call this m)
// so each user takes m minutes to run
// so if we have n users, we have to run n * m minutes
// which is n^2 / 100 minutes
// WHICH IS LIKE A WEEK ONCE WE HIT 1000 FOLLOWERS FUCK

// Easy solve: have users sign in (F)
// Hard solve: store the following for each new user as we get them in a DB
    // Then we only need to do full calculations for new followers
    // This gets us down to 1 request per user maximally when we do finally run the algorithm
    // Which lets us do this in n minutes, which is still fucking long
    // BUT if we store ALL the followers, we can match with the DB data instead of doing the request for everyone
    // This way we are not taking n minutes, just doing the algorithm

// Absolutely, positively, fuck this entire thing
// We're just gonna ask people to sign in via twitter lmaoooooooooo
// gg no re, algorithms were a mistake, satan invented Rate Limits
// good night
// F in chat thx