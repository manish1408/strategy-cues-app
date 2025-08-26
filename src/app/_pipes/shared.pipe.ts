import { NgModule } from '@angular/core';

import { JoinTopicsPipe } from './joinTopics.pipe';
import { SafePipe } from './safe.pipe';
import { SummaryPipe } from './summary.pipe';
import { TimeAgoPipe } from './timeAgo.pipe';
import { FeatureVisibilityPipe } from './featureVisible.pipe';

@NgModule({
	declarations: [JoinTopicsPipe, SafePipe, SummaryPipe, TimeAgoPipe,],
	exports: [JoinTopicsPipe, SafePipe, SummaryPipe, TimeAgoPipe],
})
export class SharedPipe {}
