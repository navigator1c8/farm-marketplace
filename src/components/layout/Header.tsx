import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { getCartItemsCount } = useCart();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const categories = [
    {
      name: 'Овощи',
      href: '/catalog/vegetables',
      subcategories: [
        { name: 'Листовые', href: '/catalog/vegetables/leafy' },
        { name: 'Корнеплоды', href: '/catalog/vegetables/root' },
        { name: 'Пасленовые', href: '/catalog/vegetables/nightshade' },
        { name: 'Капустные', href: '/catalog/vegetables/cabbage' },
      ],
    },
    {
      name: 'Фрукты и ягоды',
      href: '/catalog/fruits',
      subcategories: [
        { name: 'Семечковые', href: '/catalog/fruits/pome' },
        { name: 'Косточковые', href: '/catalog/fruits/stone' },
        { name: 'Ягоды', href: '/catalog/fruits/berries' },
      ],
    },
    {
      name: 'Мясо и птица',
      href: '/catalog/meat',
      subcategories: [
        { name: 'Говядина', href: '/catalog/meat/beef' },
        { name: 'Свинина', href: '/catalog/meat/pork' },
        { name: 'Курица', href: '/catalog/meat/chicken' },
        { name: 'Индейка', href: '/catalog/meat/turkey' },
      ],
    },
    {
      name: 'Молочные продукты',
      href: '/catalog/dairy',
      subcategories: [
        { name: 'Молоко и сливки', href: '/catalog/dairy/milk' },
        { name: 'Сыры', href: '/catalog/dairy/cheese' },
        { name: 'Творог и сметана', href: '/catalog/dairy/cottage' },
        { name: 'Яйца', href: '/catalog/dairy/eggs' },
      ],
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Icon name="Sprout" className="h-6 w-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900">ФермаМаркет</h1>
              <p className="text-xs text-gray-500">Свежие продукты с фермы</p>
            </div>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="search"
                placeholder="Поиск продуктов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4"
              />
              <Icon
                name="Search"
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              />
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Button
              variant="ghost"
              size="sm"
              className="relative"
              onClick={() => navigate('/cart')}
            >
              <Icon name="ShoppingCart" className="h-5 w-5" />
              {getCartItemsCount() > 0 && (
                <Badge className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 text-xs">
                  {getCartItemsCount()}
                </Badge>
              )}
            </Button>

            {/* User menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <Icon name="User" className="h-5 w-5" />
                    <span className="hidden sm:inline">{user?.firstName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <Icon name="User" className="mr-2 h-4 w-4" />
                    Профиль
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/orders')}>
                    <Icon name="Package" className="mr-2 h-4 w-4" />
                    Мои заказы
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/wishlist')}>
                    <Icon name="Heart" className="mr-2 h-4 w-4" />
                    Избранное
                  </DropdownMenuItem>
                  {user?.role === 'farmer' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/farmer/dashboard')}>
                        <Icon name="BarChart3" className="mr-2 h-4 w-4" />
                        Панель фермера
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <Icon name="LogOut" className="mr-2 h-4 w-4" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                  Войти
                </Button>
                <Button size="sm" onClick={() => navigate('/register')}>
                  Регистрация
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="border-t">
          <NavigationMenu className="mx-auto">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink
                  className={cn(
                    'group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50'
                  )}
                  href="/"
                >
                  Главная
                </NavigationMenuLink>
              </NavigationMenuItem>

              {categories.map((category) => (
                <NavigationMenuItem key={category.name}>
                  <NavigationMenuTrigger>{category.name}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      {category.subcategories.map((subcategory) => (
                        <NavigationMenuLink
                          key={subcategory.name}
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          href={subcategory.href}
                        >
                          <div className="text-sm font-medium leading-none">
                            {subcategory.name}
                          </div>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ))}

              <NavigationMenuItem>
                <NavigationMenuLink
                  className={cn(
                    'group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50'
                  )}
                  href="/farmers"
                >
                  Фермеры
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  className={cn(
                    'group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50'
                  )}
                  href="/about"
                >
                  О нас
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  className={cn(
                    'group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50'
                  )}
                  href="/blog"
                >
                  Блог
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  className={cn(
                    'group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50'
                  )}
                  href="/contact"
                >
                  Контакты
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;