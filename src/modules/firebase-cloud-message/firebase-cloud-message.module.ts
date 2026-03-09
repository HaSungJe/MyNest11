import { Module } from '@nestjs/common';
import { FirebaseCloudeMessageService } from './firebase-cloud-message.service';

@Module({ 
    imports: [FirebaseCloudeMessageService], 
    exports: [FirebaseCloudeMessageService] 
})

export class FirebaseCloudMessageModule {}
