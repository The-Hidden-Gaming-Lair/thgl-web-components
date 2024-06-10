"use client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { useActivitiesStore } from "../(providers)";

const formSchema = z.object({
  category: z.string().min(1, {
    message: "Category must be at least 1 character.",
  }),
  title: z.string().min(1, {
    message: "Name must be at least 1 character.",
  }),
  max: z.number().min(1, {
    message: "Count must be a positive number.",
  }),
  frequently: z.enum(["daily", "weekly"]),
});

export function CustomActivities() {
  const [open, setOpen] = useState(false);

  const activitiesStore = useActivitiesStore();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "",
      title: "",
      max: 1,
      frequently: undefined,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (
      activitiesStore.customActivities.some(
        (activity) => activity.title === values.title,
      )
    ) {
      alert("Activity with this name already exists!");
    } else {
      activitiesStore.addCustomActivity(values);
      form.reset();
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Add Activity</Button>
      </DialogTrigger>
      <DialogContent className="w-80">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <h4 className="font-medium leading-none">Add Activity</h4>
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="Generic" {...field} />
                  </FormControl>
                  <FormDescription>
                    The activity will be grouped by this category.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter a unique name" {...field} />
                  </FormControl>
                  <FormDescription>
                    The name of the activity. Must be unique.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="max"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Count</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(event) => field.onChange(+event.target.value)}
                    />
                  </FormControl>
                  <FormDescription>
                    The number of times you can complete this activity.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="frequently"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequently</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="col-span-2 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    The frequency of this activity.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" variant="secondary">
              Submit
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
