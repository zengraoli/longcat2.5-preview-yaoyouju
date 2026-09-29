import { Controller, Get } from '@nestjs/common';

/** 就医提示：无需登录、不被任何流程阻断 */
@Controller('safety')
export class SafetyController {
  @Get('tips')
  tips() {
    return {
      title: '出现以下情况请及时就医',
      redFlags: [
        '大小便功能异常或鞍区麻木',
        '进行性下肢肌力下降',
        '夜间痛醒伴体重明显下降',
        '外伤后腰部剧痛',
        '发热伴腰痛',
      ],
      note: '本提示不构成诊断；如症状持续或加重，请前往正规医疗机构就诊。',
    };
  }
}
