const express = require('express');
const router = express.Router();
const models = require('../../models');
const passport = require('passport');

router.get('/', (req, res, next) => {
    res.send("post get");
});

router.post('/', function(req, res, next) {
	let author = req.body.author;
	let picture = req.body.picture;
	let contents = req.body.contents;
	let date = Date.now();	

	models.Post.create({
		author: author,
		picture: picture,
		contents: contents,		
		like: 0,
		createdAt: date,
		updatedAt: date,
	}).then(() => {
		return res.json({status: "SUCCESS"});
	}).catch(err => {
		if(err) console.log(err);
		return res.sendStatus(500);
	});
});

router.delete('/:post_id', function(req, res, next) {    
    let post_id = req.params.post_id;    

	passport.authenticate('jwt', {session: false}, (err, user, info) => {
		if(err) return res.sendStatus(500);		
		if(user) {
			models.Post.destroy({
				where: {
					post_id: post_id, 
					author: String(user.user_id)
				}
			}).then(() => {
                return res.sendStatus(200);
			}).catch(err => {
				if(err) console.log(err);
				return res.sendStatus(500);
			});
		}
		else
			return res.sendStatus(401);
	})(req, res, next);	
});

router.put('/:post_id', function(req, res, next) {
	let post_id = req.params.post_id;
	let contents = req.body.contents;	
	
	passport.authenticate('jwt', {session: false}, (err, user, info) => {
		if(err) return res.sendStatus(500);
		if(user) {
			models.Post.findOne({
				where: {
					post_id: post_id,
					author: String(user.user_id)
			}}).then(post => {
				if(post) {
					post.contents = contents;
					post.save()
					.then(() => {
                        return res.sendStatus(200);
					}).catch(err => {
                        if(err) console.log(err);
                        return res.sendStatus(500);
					});
				} else {
                    return res.sendStatus(401);
				}
			}).catch(err => {
                if(err) console.log(err);
                return res.sendStatus(500);
			});		
		}
        else
            return res.sendStatus(401);
	})(req, res);
});

router.put('/like/:post_id', function(req, res, next) {
	let post_id = req.params.post_id;

	models.Post.findOne({
		where: {
			post_id: post_id
		}
	}).then(post => {
		post.like++;
		post.save().then(() => {
            return res.sendStatus(200);
		}).catch(err => {
			if(err) console.log(err);
			return res.sendStatus(500);
		});
	}).catch(err => {
		console.log(err);
		return res.sendStatus(500);
	});
});

module.exports = router;
