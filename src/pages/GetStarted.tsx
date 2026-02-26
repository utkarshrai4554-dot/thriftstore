import { Link } from "react-router-dom";
import { ArrowRight, Heart, ShoppingBag, Gift, TrendingUp, Users, Leaf, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";

const GetStarted = () => {
  const { theme } = useTheme();
  
  const options = [
    {
      id: 'donate',
      icon: Heart,
      title: 'Donate',
      slogan: 'Give New Life to Pre-Loved Treasures',
      description: 'Transform your unused items into opportunities for others while supporting sustainable fashion.',
      benefits: [
        'Earn 50 reward points',
        'Free doorstep pickup',
        'Tax-deductible receipts',
        'Support sustainability'
      ],
      link: '/donate',
      color: theme === 'dark' ? 'bg-warm/10 border-warm/20' : 'bg-red-50 border-red-200',
      iconColor: theme === 'dark' ? 'text-warm-foreground' : 'text-red-600',
      buttonColor: theme === 'dark' ? 'bg-warm hover:bg-warm/90' : 'bg-red-600 hover:bg-red-700'
    },
    {
      id: 'sell',
      icon: ShoppingBag,
      title: 'Sell',
      slogan: 'Turn Your Closet into Cash',
      description: 'Monetize your pre-loved fashion items while contributing to circular economy.',
      benefits: [
        'Keep 80% of sale price',
        'Free authentication',
        'Instant payment',
        'Reach thousands'
      ],
      link: '/sell',
      color: theme === 'dark' ? 'bg-card border-border' : 'bg-blue-50 border-blue-200',
      iconColor: theme === 'dark' ? 'text-card-foreground' : 'text-blue-600',
      buttonColor: theme === 'dark' ? 'bg-primary hover:bg-primary/90' : 'bg-blue-600 hover:bg-blue-700'
    },
    {
      id: 'purchase',
      icon: Gift,
      title: 'Purchase',
      slogan: 'Discover Unique Stories in Every Piece',
      description: 'Find curated, authenticated pre-loved fashion that expresses your unique style.',
      benefits: [
        'Save 50-70% vs retail',
        'Verified authenticity',
        'Earn reward points',
        'Unique curated pieces'
      ],
      link: '/products',
      color: theme === 'dark' ? 'bg-success/10 border-success/20' : 'bg-green-50 border-green-200',
      iconColor: theme === 'dark' ? 'text-success-foreground' : 'text-green-600',
      buttonColor: theme === 'dark' ? 'bg-success hover:bg-success/90' : 'bg-green-600 hover:bg-green-700'
    }
  ];

  const thriftStats = [
    { icon: TrendingUp, label: 'Market Growth', value: '64%', desc: 'Annual growth in thrift market' },
    { icon: Users, label: 'Active Users', value: '2M+', desc: 'Thrift shoppers globally' },
    { icon: Leaf, label: 'Environmental Impact', value: '70%', desc: 'Less carbon footprint vs new' },
    { icon: Award, label: 'Money Saved', value: '$2.5B', desc: 'Saved by thrift shoppers annually' }
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-6">
            Choose Your <span className="text-primary">Thrift Journey</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
            Join the sustainable fashion revolution. Whether you're donating, selling, or shopping,
            you're part of a movement that's changing how we think about fashion.
          </p>
        </div>
      </section>

      {/* Three Options */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            {options.map((option, index) => (
              <Card key={option.id} className={`${option.color} border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
                <CardContent className="p-5">
                  <div className={`w-12 h-12 rounded-full ${option.color} flex items-center justify-center mb-4`}>
                    <option.icon className={`h-6 w-6 ${option.iconColor}`} />
                  </div>
                  
                  <h3 className="font-display text-xl font-bold mb-2">{option.title}</h3>
                  <p className="text-base font-medium text-muted-foreground mb-3">{option.slogan}</p>
                  <p className="text-xs text-muted-foreground mb-4">{option.description}</p>
                  
                  <div className="space-y-1 mb-4">
                    {option.benefits.map((benefit, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {benefit}
                      </div>
                    ))}
                  </div>
                  
                  <Link to={option.link}>
                    <Button className={`w-full ${option.buttonColor}`}>
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Thrift Store Analysis */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              The Thrift Revolution in Today's World
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Thrift shopping has transformed from a budget-conscious choice to a powerful movement 
              driving sustainable fashion, circular economy, and conscious consumerism.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {thriftStats.map((stat, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <stat.icon className="h-8 w-8 mx-auto mb-4 text-primary" />
                  <div className="font-display text-3xl font-bold text-primary mb-2">{stat.value}</div>
                  <div className="font-semibold mb-1">{stat.label}</div>
                  <div className="text-sm text-muted-foreground">{stat.desc}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Analysis Content */}
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div>
              <h3 className="font-display text-2xl font-bold mb-4">Why Thrift Matters Today</h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  The global thrift market is experiencing unprecedented growth, driven by Gen Z and 
                  Millennials who prioritize sustainability over fast fashion. With 64% annual growth, 
                  thrift shopping has become mainstream, not niche.
                </p>
                <p>
                  Environmental consciousness is at an all-time high. Every thrift purchase reduces 
                  carbon footprint by 70% compared to buying new, making it a powerful tool against 
                  climate change and textile waste.
                </p>
                <p>
                  Economic factors play a crucial role too. With inflation affecting traditional retail, 
                  thrift offers quality fashion at 50-70% savings without compromising style or authenticity.
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-display text-2xl font-bold mb-4">The Future of Fashion</h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  The circular economy model is reshaping fashion. By 2030, experts predict that 
                  secondhand will represent 30% of the entire fashion market, fundamentally changing 
                  how we produce, consume, and value clothing.
                </p>
                <p>
                  Technology is revolutionizing thrifting with AI-powered recommendations, 
                  virtual try-ons, and blockchain authentication, making online thrift shopping as 
                  convenient as traditional retail.
                </p>
                <p>
                  Community building around sustainable fashion creates a new social fabric where 
                  sharing, repairing, and upcycling become the norm, not the exception.
                </p>
              </div>
            </div>
          </div>

          {/* Impact Section */}
          <div className="bg-primary/5 rounded-2xl p-8 text-center">
            <h3 className="font-display text-2xl font-bold mb-4">Your Impact Matters</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
              Every time you choose thrift, you're not just saving money – you're voting for a 
              sustainable future, supporting local communities, and reducing fashion's environmental 
              footprint.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="font-display text-3xl font-bold text-primary mb-1">2.1M</div>
                <div className="text-sm text-muted-foreground">Tons of textile waste saved annually</div>
              </div>
              <div className="text-center">
                <div className="font-display text-3xl font-bold text-primary mb-1">47%</div>
                <div className="text-sm text-muted-foreground">Reduced water consumption</div>
              </div>
              <div className="text-center">
                <div className="font-display text-3xl font-bold text-primary mb-1">35M</div>
                <div className="text-sm text-muted-foreground">Items given new life yearly</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Ready to Join the Movement?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start your thrift journey today and become part of sustainable fashion revolution 
            that's changing the world, one piece at a time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="px-8 text-base">
                Create Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/products">
              <Button size="lg" variant="outline" className="px-8 text-base">
                Browse Collections
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GetStarted;
