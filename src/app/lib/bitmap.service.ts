import { Injectable, Type, Component } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ImageSource } from 'tns-core-modules/image-source';
import * as BitmapFactory from "nativescript-bitmap-factory";

@Injectable()
export class BitmapService {

  constructor() {
  }

  crop(src: ImageSource, left: number, right: number, top: number, bottom: number): Promise<ImageSource> {
 
    return new Promise<ImageSource>((resolve, reject) => {

      // make bitmap mutable
      var mute = BitmapFactory.makeMutable(src);

      // create bmp to crop  
      var bmp = BitmapFactory.create(src.width, src.height);
      bmp.dispose(() => {
        bmp.insert(mute);
        let w = right - left;
        let h = bottom - top;
        var crp = bmp.crop( { x:left , y:top }, { width: w, height: h } );
        let img = crp.toImageSource();
        resolve(img);
      });
    });
  }

  resize(src: ImageSource, width: number, height: number): Promise<ImageSource> {
  
    return new Promise<ImageSource>((resolve, reject) => {
    
      // make bitmap mutable
      var mute = BitmapFactory.makeMutable(src);

      // create bmp to crop  
      var bmp = BitmapFactory.create(src.width, src.height);
      bmp.dispose(() => {
        bmp.insert(mute);
        var res = bmp.resize(width + "," + height);
        let img = res.toImageSource();
        resolve(img);
      });
    });
  } 

  convert(base: string): Promise<string> {

    // load full size image
    let src: ImageSource = ImageSource.fromBase64Sync(base);
    
    // scale to icon size
    return new Promise<string>((resolve, reject) => {
      this.resize(src, 48, 48).then(s => {
        resolve(s.toBase64String("jpg", 100));
      }).catch(err => {
        reject(err);
      });
    });
  }
}

