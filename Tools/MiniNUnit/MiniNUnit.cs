// MiniNUnit.cs
// A TINY stand-in for the NUnit test library, used ONLY by
// Tools/run-core-tests.ps1 so the Core tests can run on a PC without Unity.
// Inside Unity the real NUnit is used and this file is NOT part of the
// project (it lives outside the Assets folder).
//
// It supports only what our tests use: [TestFixture], [Test], [SetUp] and
// a few Assert methods.

using System;
using System.Collections.Generic;
using System.Reflection;

namespace NUnit.Framework
{
    [AttributeUsage(AttributeTargets.Class)]
    public class TestFixtureAttribute : Attribute { }

    [AttributeUsage(AttributeTargets.Method)]
    public class TestAttribute : Attribute { }

    [AttributeUsage(AttributeTargets.Method)]
    public class SetUpAttribute : Attribute { }

    public class AssertionException : Exception
    {
        public AssertionException(string message) : base(message) { }
    }

    public static class Assert
    {
        public static void AreEqual(object expected, object actual)
        {
            if (!Equals(expected, actual))
                throw new AssertionException("Expected " + expected + " but was " + actual);
        }

        public static void AreEqual(double expected, double actual, double delta)
        {
            if (Math.Abs(expected - actual) > delta)
                throw new AssertionException("Expected " + expected + " +/- " + delta + " but was " + actual);
        }

        public static void AreNotEqual(object notExpected, object actual)
        {
            if (Equals(notExpected, actual))
                throw new AssertionException("Did not expect " + actual);
        }

        public static void IsTrue(bool condition) { if (!condition) throw new AssertionException("Expected true"); }
        public static void IsTrue(bool condition, string message) { if (!condition) throw new AssertionException(message); }
        public static void IsFalse(bool condition) { if (condition) throw new AssertionException("Expected false"); }
        public static void IsFalse(bool condition, string message) { if (condition) throw new AssertionException(message); }
        public static void IsNull(object o) { if (o != null) throw new AssertionException("Expected null"); }
        public static void IsNotNull(object o) { if (o == null) throw new AssertionException("Expected not null"); }
        public static void IsNotNull(object o, string message) { if (o == null) throw new AssertionException(message); }

        public static void Greater(double a, double b) { if (!(a > b)) throw new AssertionException(a + " is not > " + b); }
        public static void GreaterOrEqual(double a, double b) { if (!(a >= b)) throw new AssertionException(a + " is not >= " + b); }
        public static void Less(double a, double b) { if (!(a < b)) throw new AssertionException(a + " is not < " + b); }
        public static void LessOrEqual(double a, double b) { if (!(a <= b)) throw new AssertionException(a + " is not <= " + b); }

        public static void Fail(string message) { throw new AssertionException(message); }
    }
}

namespace MiniNUnitRunner
{
    using NUnit.Framework;

    public static class Program
    {
        public static int Main()
        {
            int passed = 0;
            List<string> failures = new List<string>();

            foreach (Type type in typeof(Program).Assembly.GetTypes())
            {
                if (type.GetCustomAttributes(typeof(TestFixtureAttribute), false).Length == 0) continue;

                MethodInfo[] methods = type.GetMethods(BindingFlags.Public | BindingFlags.Instance);
                foreach (MethodInfo test in methods)
                {
                    if (test.GetCustomAttributes(typeof(TestAttribute), false).Length == 0) continue;

                    object fixture = Activator.CreateInstance(type);
                    string name = type.Name + "." + test.Name;
                    try
                    {
                        foreach (MethodInfo setUp in methods)
                        {
                            if (setUp.GetCustomAttributes(typeof(SetUpAttribute), false).Length > 0)
                                setUp.Invoke(fixture, null);
                        }
                        test.Invoke(fixture, null);
                        passed++;
                        Console.WriteLine("  PASS  " + name);
                    }
                    catch (TargetInvocationException e)
                    {
                        Exception inner = e.InnerException ?? e;
                        failures.Add(name + ": " + inner.Message);
                        Console.WriteLine("  FAIL  " + name + " -> " + inner.Message);
                    }
                }
            }

            Console.WriteLine();
            Console.WriteLine(passed + " passed, " + failures.Count + " failed");
            return failures.Count == 0 ? 0 : 1;
        }
    }
}
