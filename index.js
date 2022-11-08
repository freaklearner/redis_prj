const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { json } = require('express');
const Redis = require('redis');

const app = express();
app.use(express.urlencoded({extended: true}));
//app.use(cors);

const redisClient = Redis.createClient();

DEFAULT_EXPIRATION = 3600;
app.get('/',(req,res,next)=>{
    res.send('data');
})

app.get('/photos',async (req,res,next)=>{
    console.log('request')
    const album = req.query.album;
    const key = `photosalbum=${album}`;
    getorSetCache(key,async ()=>{
        const {data} = await axios.get('https://jsonplaceholder.typicode.com/photos',{params:{album}});
        return data;
    })
    .then(data=>{
        res.send(data);
    })
    .catch(err=>{
        console.log(err);
        res.send([]);
    })
    // redisClient.get(key)
    // .then(async photos=>{
    //     if(photos!=null){
    //         console.log('HIT');
    //         res.json(JSON.parse(photos));
    //     }
    //     else{
    //         console.log('MISS');
    //         console.log(album);
    //         const {data} = await axios.get('https://jsonplaceholder.typicode.com/photos',{params:{album}});
    //         redisClient.setEx(key,DEFAULT_EXPIRATION,JSON.stringify(data));
    //         res.json(data);
    //     }
    // })
    // .catch(err=>{
    //     console.log(err);
    // })
    
})

app.get('/photo/:id',async (req,res,next)=>{
    const photoId = req.params.id;
    const key = `photo:${photoId}`;
    getorSetCache(key,async ()=>{
        const { data } = await axios.get(`https://jsonplaceholder.typicode.com/photos/${photoId}`);
        return data;
    })
    .then(data=>{
        res.send(data);
    })
    .catch(error=>{
        console.log(error);
        res.status(500).json(error);
    })
    
})

const getorSetCache=(key , cb)=>{
    return new Promise((resolve,reject)=>{
        redisClient.get(key)
        .then(async data=>{
            if(data!=null){
                console.log('Hit');
                resolve(JSON.parse(data));
            }
            else{
                console.log('Miss');
                const newResults = await cb()
                redisClient.setEx(key, DEFAULT_EXPIRATION, JSON.stringify(newResults))
                resolve(newResults);
            }
        })
        .catch(err=>{
            reject(err);
        })
    })
}


app.listen(3002,async ()=>{
    console.log("listening at 3002");
    await redisClient.connect();
})
