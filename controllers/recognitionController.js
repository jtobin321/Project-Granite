const imageService = require('../services/imageService')
const rekognitionService = require('../services/rekognitionService')
const translateService = require('../services/translateService')
const AWS = require('aws-sdk')
AWS.config.update({region: process.env.REGION, accessKeyId: process.env.AWSACCESSKEYID, secretAccessKey: process.env.AWSSECRETACCESSKEY})
var fs = require('fs');
const path = require('path')
const s3 = new AWS.S3();
function base64_encode(file) {
    var bitmap = fs.readFileSync(file);
	return new Buffer(bitmap).toString('base64');
}

module.exports = {
    uploadImage: (req, res) => {
    	const str = base64_encode(req.file.path)
    	return imageService.imageUpload(str)
    		.then(result => {
    			return res.status(200).send(result)
    		})
    		.catch(err => {
    			return res.status(400).send(err)
    		})
	},
	uploadImageS3: async(req,res) =>{
		let params = {
			Bucket: 'granite.project',
			Key: '',
			Body:''
		}
		let fileStream = fs.createReadStream(req.file.path)
		fileStream.on('error', function(err){
			console.log('File Error', err);
		});
		params.Body = fileStream;
		params.Key = path.basename(req.file.originalname);
		await new Promise((resolve,reject) =>{
			s3.upload(params, (err, data) =>{
				if(err){
					reject(err);
				}
				if(data){
					console.log(data);
					resolve(data);
				}
			})
		})
		
		const stuff = await rekognitionService.getLabels(params)
								.catch(err => res.status(400).send({err}))
		const stuff2 = await translateService.translate(stuff)
								.catch(err => res.status(400).send({err}))

		return res.status(200).send(stuff2)
	}
}