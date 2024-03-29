import React from 'react';
import ReactDOM from 'react-dom';

import reddit from '../api/reddit.js';
import StreamItemView from './StreamItemView.js';
import StreamSpinnerView from './StreamSpinnerView.js';
import PostModel from '../models/PostModel.js';

class StreamView extends React.Component {

    constructor(props) {
        super(props);

        this.defaultSubreddit = "all";

        // temporarily assume all to be the default sub
        let subreddit = this.props.params.subreddit || this.defaultSubreddit;
        this.state = {
            subreddit: subreddit,
            posts: [],
            sort: "hot",
            after: null,
            isLoading: false
        };

    }

    removeDuplicatePosts(posts) {
        let seen = {};
        let finalArray = [];
        posts.forEach(post => {
            if (seen[post.data.id] !== 1) {
                seen[post.data.id] = 1;
                finalArray.push(post);
            }
        });

        return finalArray;
    }

    load(subreddit = this.defaultSubreddit, options = { reset: false }) {
        if (this.state.isLoading) return;

        let loadPosts = () => {
            // retreive the posts
            reddit.getPostsFromSubreddit(subreddit, { sort: this.state.sort, after: this.state.after }, (err, posts) => {
                // update state to re render
                let newPosts = posts.body.data.children;
                let oldPosts = this.state.posts;
                oldPosts.push(...newPosts);

                let filteredPosts = this.removeDuplicatePosts(oldPosts);
                let lastPost = filteredPosts[filteredPosts.length - 1];
                this.setState({
                    subreddit: subreddit,
                    posts: filteredPosts,
                    after: posts.body.data.after,
                    isLoading: false
                });
            });
        }.bind(this);

        if (options.reset) {
            // reset
            this.setState({
                subreddit: subreddit,
                posts: [],
                sort: "hot",
                after: null,
                isLoading: true
            }, loadPosts);
        } else {
            this.setState({
                isLoading: true
            }, loadPosts);
        }
    }

    componentWillReceiveProps(props) {
        this.load(props.params.subreddit, { reset: true }); // loads new prop info
    }

    componentWillUnmount() {
        this.detachScrollListener();
    }

    componentDidMount() {
        this.attachScrollListener();
        // load the posts
        this.load();
    }

    scrollListener() {
        let node = ReactDOM.findDOMNode(this);
        // detect scrolling to the bottom
        if (node.scrollHeight - (node.scrollTop + node.offsetHeight) < 100) {
            this.load();
        }
    }

    attachScrollListener() {
        let node = ReactDOM.findDOMNode(this);
        node.addEventListener('scroll', this.scrollListener.bind(this));
        node.addEventListener('resize', this.scrollListener.bind(this));
    }

    detachScrollListener() {
        let node = ReactDOM.findDOMNode(this);
        node.removeEventListener('scroll', this.scrollListener.bind(this));
        node.removeEventListener('resize', this.scrollListener.bind(this));
    }

    render() {
        let postViews = [];
        this.state.posts.forEach(post => {
            let postObj = new PostModel(post);
            postViews.push(<StreamItemView key={postObj.get('id')} post={postObj} />);
        });

        var loading = this.state.isLoading ? <StreamSpinnerView/> : false;

        return (
            <div className="stream-view">
                {postViews}
                {loading}
            </div>
        )
    }

}

export default StreamView;
