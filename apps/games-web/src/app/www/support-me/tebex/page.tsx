import Link from "next/link";
import { Suspense } from "react";
import { Check } from "lucide-react";
import { Button, Card, CardContent } from "@repo/ui/controls";
import { cn } from "@/games/thgl-web/lib/utils";
import { TebexCheckoutNotice } from "@/games/thgl-web/components/tebex-checkout-notice";
import { TEBEX_CN_PRICES, type TebexTierKey } from "@/lib/tebex";

// China test (Leon 2026-10-07): unlisted Tebex checkout for mainland China -
// Alipay + WeChat Pay only (the Tebex store has every other method disabled),
// China regional prices, a Free tier for an account without Patreon. Not
// linked from anywhere, not in the sitemap, noindex; invited testers get the
// link.
export const metadata = {
  title: "支持 TH.GL – 支付宝 / 微信支付",
  description: "使用支付宝或微信支付支持 TH.GL，无需 Patreon 账户。",
  robots: {
    index: false,
    follow: false,
  },
};

const CN_TIERS: {
  key: TebexTierKey;
  title: string;
  perks: string[];
  cta: string;
  highlight?: boolean;
}[] = [
  {
    key: "free",
    title: "免费 Free",
    perks: ["TH.GL 账户", "在地图标记上发表评论"],
    cta: "免费创建账户",
  },
  {
    key: "pro",
    title: "Pro",
    perks: ["去除我的应用和网站上的广告", "高级功能"],
    cta: "订阅 Pro",
  },
  {
    key: "elite",
    title: "Elite",
    perks: ["去除我的应用和网站上的广告", "高级功能", "抢先体验预览版本"],
    cta: "订阅 Elite",
    highlight: true,
  },
];

export default function SupportMeTebex() {
  return (
    <div className="space-y-10 px-4 pt-10 pb-20 max-w-7xl mx-auto">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold">支持 TH.GL</h1>
        <p className="text-muted-foreground">
          我是一名独立开发者，全职开发 TH.GL
          的互动地图、伴侣应用和网站。现在你可以使用支付宝或微信支付来支持我，无需
          Patreon 账户。
        </p>
        <p className="text-sm text-muted-foreground">
          Support TH.GL with Alipay or WeChat Pay - no Patreon account needed.
        </p>
      </div>

      <Suspense>
        <TebexCheckoutNotice />
      </Suspense>

      <div className="flex flex-wrap justify-center gap-6 max-w-6xl mx-auto">
        {CN_TIERS.map((tier) => {
          const price = TEBEX_CN_PRICES[tier.key];
          return (
            <Card
              key={tier.key}
              className={cn(
                "flex flex-col w-full max-w-[320px]",
                tier.highlight &&
                  "border-primary shadow-lg shadow-primary/20 md:scale-105",
              )}
            >
              <CardContent className="p-6 flex flex-col gap-6 h-full">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">{tier.title}</h2>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-primary">
                      ¥{price.cny}
                    </span>
                    {tier.key !== "free" && (
                      <span className="text-muted-foreground text-sm">
                        / 月
                      </span>
                    )}
                  </div>
                </div>
                <ul className="grow space-y-3">
                  {tier.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-sm">
                      <Check className="h-5 w-5 text-primary shrink-0" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
                {tier.key === "free" ? (
                  // Free = email sign-up (one-time code), no checkout.
                  <Button
                    size="lg"
                    variant="secondary"
                    className="w-full"
                    asChild
                  >
                    <Link href="/support-me/account#email-sign-in">
                      {tier.cta}
                    </Link>
                  </Button>
                ) : (
                  <form method="post" action="/api/tebex/checkout">
                    <input type="hidden" name="tier" value={tier.key} />
                    <Button
                      type="submit"
                      size="lg"
                      variant={tier.highlight ? "default" : "secondary"}
                      className="w-full"
                    >
                      {tier.cta}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center text-sm text-muted-foreground space-y-3 max-w-2xl mx-auto">
        <p>
          付款方式：支付宝、微信支付。付款由 Tebex
          处理（商家记录方）。结账页面可能以美元显示价格（Pro 约 $
          {TEBEX_CN_PRICES.pro.usd}，Elite 约 ${TEBEX_CN_PRICES.elite.usd}
          ），实际人民币金额以当日汇率为准。
        </p>
        <p>
          完成后你会回到
          <Link
            href="/support-me/account"
            className="text-primary underline font-medium"
          >
            账户页面
          </Link>
          ，几秒钟内即可激活。之后在其他浏览器、其他设备或伴侣应用中，用你付款时填写的邮箱登录即可（我们会发送一次性验证码，无需密码）。
        </p>
        <p>
          你可以随时在账户页面点击“Manage
          Subscription”取消订阅，权益会保留到当前付费月结束。
        </p>
      </div>
    </div>
  );
}
