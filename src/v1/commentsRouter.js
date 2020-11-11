const express = require('express');
const router = express.Router();
const passport = require('passport');
const models = require('../../models');

router.post('/:post_id', (req, res, next) => {	
	passport.authenticate('jwt', {session: false}, async (err, user, info) => {
		if(err){
			console.log(err);
			return res.sendStatus(500);
		} 
		const t = await models.sequelize.transaction();
		let user_id = '비 로그인 유저';
		let date = Date.now();	
		if(user)
			user_id = user.user_id;
		try {
			const comment = await models.Comment.create({
				author: user_id,
				comment: req.body.comment,
				updatedAt: date,
				createdAt: date
			}, {transaction: t});

			const post = await models.Post.findOne({
				where: {
				  post_id: req.params.post_id
				},
				transaction: t 
			  });

			await post.update({
				comments: models.sequelize.fn('array_append', models.sequelize.col('comments'), comment.comment_id)
			}, {
				where: {
					post_id: req.params.post_id
					},
					transaction: t
			});
			  
			await t.commit();
		} catch(err) {
			console.log(err);
			await t.rollback();
		}

		if(user) {
			return res.render('index', {name: user.user_id, picture: '/images/user.png'});
		}
		else{
			return res.render('index', {name: '비로그인 유저', picture: '/images/user.png'});
		}			
	})(req, res, next);
});

router.put('/:comment_id', (req, res)=>{
	let comment_id = req.params.comment_id;
	let comment = req.body.comment;	
	
	passport.authenticate('jwt', {session: false}, (err, user, info) => {
		if(err) return res.sendStatus(500);
		if(user) {
			models.Comment.findOne({
				where: {
					comment_id: comment_id,
					author: String(user.user_id)
			}}).then(result => {
				if(result) {
					result.comment = comment;
					result.save()
					.then(() => {
						return res.json({status: "SUCCESS"});
					}).catch(err => {
						if(err) console.log(err);
						return res.json({status: "error"});
					});
				} else {
					return res.json({status: "unAuthorized"});
				}
			}).catch(err => {
				if(err) console.log(err);
				return res.json({status: "error"});
			});		
		}
		else
			return res.json({status: "unAuthorized"});
	})(req, res);
});


router.delete('/:comment_id', function(req, res, next) {
	let post_id = req.body.post_id;
	let comment_id = req.params.comment_id;

	passport.authenticate('jwt', {session: false}, async (err, user, info) => {
		if(err) return res.sendStatus(500);		
		if(user) {
			const t = await models.sequelize.transaction();
			try {
				let comment = await models.Comment.destroy({
					where: {
						comment_id: comment_id,
						author: String(user.user_id)
					},
					transaction: t
				});	
				
				if(comment) {
					await models.Post.update({
						comments: models.sequelize.fn('array_remove', models.sequelize.col('comments'), comment_id)
					}, {
						where: {
							post_id: post_id
						},
						transaction: t
					});
				}
	
				await t.commit();

			} catch(err) {
				console.log(err);
				await t.rollback();
				return res.sendStatus(500);
			}			

			return res.sendStatus(200);
		}
		else
			return res.sendStatus(401);
	})(req, res, next);
});

module.exports = router;
